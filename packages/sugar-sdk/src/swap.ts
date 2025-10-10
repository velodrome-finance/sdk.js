import {
  getAccount,
  getClient,
  readContracts,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { Address, createWalletClient, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { getPoolsForSwaps } from "./pools.js";
import { applyPct } from "./primitives/externals/app/src/hooks/math.js";
import {
  executeSwapParams,
  getBestQuote,
  getPaths,
  getQuoteForSwapVars,
  getSwapQuoteParams,
  getSwapVars,
  Quote,
  Token,
} from "./primitives/index.js";
import {
  BaseParams,
  ensureConnectedChain,
  processBatchesConcurrently,
} from "./utils.js";

/**
 * Contains the encoded call data required to execute a swap transaction.
 */
interface CallDataForSwap {
  /** Encoded command sequence for the Universal Router */
  commands: Hex;
  /** Array of encoded input parameters for each command */
  inputs: Hex[];
  /** Minimum acceptable output amount after slippage */
  minAmountOut: bigint;
  /** Price impact of the swap in basis points */
  priceImpact: bigint;
}

/**
 * Generates the encoded call data required to execute a token swap.
 *
 * This function calculates the best swap route, applies slippage tolerance, and returns
 * the encoded transaction data without executing the swap. Useful for building custom
 * transaction flows or estimating gas.
 *
 * @param params - Swap parameters
 * @param params.config - The Sugar SDK configuration
 * @param params.fromToken - The token being sold
 * @param params.toToken - The token being bought
 * @param params.amountIn - Amount of fromToken to swap (as bigint)
 * @param params.account - Address of the account executing the swap
 * @param params.slippage - Slippage tolerance as decimal (e.g., 0.01 for 1%)
 * @returns Promise that resolves to a CallDataForSwap object containing commands, inputs, minAmountOut, and priceImpact, or null if no valid route is found
 * @throws Error if slippage is not between 0 and 1
 *
 * @example
 * ```typescript
 * const callData = await getCallDataForSwap({
 *   config,
 *   fromToken: usdcToken,
 *   toToken: wethToken,
 *   amountIn: 1000000n, // 1 USDC (6 decimals)
 *   account: "0x...",
 *   slippage: 0.005, // 0.5%
 * });
 * // callData: CallDataForSwap | null
 * ```
 */
export async function getCallDataForSwap({
  config,
  fromToken,
  toToken,
  amountIn,
  account,
  slippage,
}: BaseParams & {
  fromToken: Token;
  toToken: Token;
  amountIn: bigint;
  account: Address;
  slippage: number;
}): Promise<CallDataForSwap | null> {
  if (slippage < 0 || slippage > 1) {
    throw new Error("Invalid slippage value. Should be between 0 and 1.");
  }

  const quote = await getQuoteForSwap({ config, fromToken, toToken, amountIn });

  if (!quote) {
    return null;
  }

  const { planner } = getSwapVars(
    config.sugarConfig,
    quote,
    `${Math.ceil(slippage * 100)}`,
    account
  );

  return {
    commands: planner.commands as Hex,
    inputs: planner.inputs as Hex[],
    minAmountOut: applyPct(
      quote.amountOut,
      quote.toToken.decimals,
      slippage * 100
    ),
    priceImpact: quote.priceImpact,
  };
}

/**
 * Fetches the best quote for swapping between two tokens.
 *
 * Analyzes all available liquidity pools and routing paths to find the most
 * favorable swap rate. The quote includes the expected output amount and price impact.
 *
 * @param params - Quote parameters
 * @param params.config - The Sugar SDK configuration
 * @param params.fromToken - The token being sold
 * @param params.toToken - The token being bought
 * @param params.amountIn - Amount of fromToken to swap (as bigint)
 * @returns Promise that resolves to a Quote object with amountOut, path, and priceImpact, or null if no valid route exists
 *
 * @example
 * ```typescript
 * const quote = await getQuoteForSwap({
 *   config,
 *   fromToken: usdcToken,
 *   toToken: wethToken,
 *   amountIn: 1000000n,
 * });
 * if (quote) {
 *   console.log(`Expected output: ${quote.amountOut}`);
 *   console.log(`Price impact: ${quote.priceImpact}%`);
 * }
 * // quote: Quote | null
 * ```
 */
export async function getQuoteForSwap({
  config,
  fromToken,
  toToken,
  amountIn,
}: BaseParams & {
  fromToken: Token;
  toToken: Token;
  amountIn: bigint;
}): Promise<Quote | null> {
  const { chainId, mustExcludeTokens, spenderAddress } = getQuoteForSwapVars(
    config.sugarConfig,
    fromToken,
    toToken
  );
  const pools = await getPoolsForSwaps({ config, chainId });

  const paths = getPaths({
    config: config.sugarConfig,
    pools,
    fromToken,
    toToken,
    mustExcludeTokens,
    chainId,
  });

  if (paths.length === 0) {
    return null;
  }

  const quoteResponses = await processBatchesConcurrently({
    items: paths,
    batchSize: 50,
    concurrentLimit: 10,
    processBatch: async (batch) =>
      readContracts(config, {
        contracts: batch.map((path) =>
          getSwapQuoteParams({
            config: config.sugarConfig,
            chainId,
            path: path.nodes,
            amountIn,
          })
        ),
      }),
  });

  const quotes = quoteResponses
    .map((response, i) => {
      const amountOut = response.result?.[0];
      // also filters out 0n
      return !amountOut
        ? null
        : ({
            path: paths[i],
            amount: amountIn,
            amountOut,
            fromToken,
            toToken,
            priceImpact: 0n,
            spenderAddress,
          } as Quote);
    })
    .filter((quote) => quote !== null);

  return getBestQuote([quotes]);
}

/**
 * Executes a token swap transaction on-chain.
 *
 * Submits a swap transaction to the blockchain using the Universal Router contract.
 * Automatically switches to the correct chain if needed. Optionally waits for the
 * transaction to be confirmed.
 *
 * Supports two execution modes:
 * - With a connected wallet (via wagmi connectors)
 * - With a private key for direct transaction signing
 *
 * @param params - Swap execution parameters
 * @param params.config - The Sugar SDK configuration
 * @param params.quote - The swap quote to execute (from getQuoteForSwap)
 * @param params.slippagePct - Slippage tolerance as percentage string (e.g., "50" for 0.5%)
 * @param params.waitForReceipt - Whether to wait for transaction confirmation (default: true)
 * @param params.privateKey - Optional private key for direct transaction signing. If provided, the swap will be executed using this key instead of a connected wallet
 * @returns Promise that resolves to the transaction hash as a string
 * @throws Error if the transaction fails or is reverted
 * @throws Error if no connected account is found and no private key is provided
 *
 * @example
 * // Using a connected wallet
 * ```typescript
 * const quote = await getQuoteForSwap({ config, fromToken, toToken, amountIn });
 * const txHash = await swap({
 *   config,
 *   quote,
 *   slippagePct: "50", // 0.5% slippage
 * });
 * console.log(`Swap executed: ${txHash}`);
 * // txHash: string (e.g., "0x1234...")
 * ```
 *
 * @example
 * // Using a private key
 * ```typescript
 * const quote = await getQuoteForSwap({ config, fromToken, toToken, amountIn });
 * const txHash = await swap({
 *   config,
 *   quote,
 *   slippagePct: "50",
 *   privateKey: "0x..." as Hex, // Private key for signing
 * });
 * console.log(`Swap executed: ${txHash}`);
 * ```
 */
export async function swap({
  config,
  quote,
  slippagePct,
  waitForReceipt = true,
  privateKey,
}: BaseParams & {
  quote: Quote;
  slippagePct?: string;
  waitForReceipt?: boolean;
  privateKey?: Hex;
}): Promise<string> {
  // Determine account address based on whether privateKey is provided
  let accountAddress: Address;
  if (privateKey) {
    const account = privateKeyToAccount(privateKey);
    accountAddress = account.address;
  } else {
    const account = getAccount(config);
    if (!account.address) {
      throw new Error(
        "No connected account found. Please connect a wallet or provide a private key."
      );
    }
    accountAddress = account.address;
  }

  const { chainId, planner, amount } = getSwapVars(
    config.sugarConfig,
    quote,
    slippagePct,
    accountAddress
  );

  // Get the Universal Router address from the execute params
  const swapParams = executeSwapParams({
    config: config.sugarConfig,
    chainId,
    commands: planner.commands as Hex,
    inputs: planner.inputs as Hex[],
    value: amount,
  });

  let hash: Hex;

  if (privateKey) {
    // re: https://wagmi.sh/core/guides/viem#private-key-mnemonic-accounts
    // XX: there does not seem to be a more elegant way to hook into wagmi connector system upstairs
    // so we are descending into viem's abyss here
    // Use viem's wallet client for private key transactions
    const account = privateKeyToAccount(privateKey);

    // Get the viem client from wagmi for the specific chain
    const viemClient = getClient(config, { chainId });

    if (!viemClient) {
      throw new Error(`No client found for chain ${chainId}`);
    }

    // Get the RPC URL from the chain configuration and create a new transport
    const rpcUrl = viemClient.chain.rpcUrls.default.http[0];
    const transport = http(rpcUrl, { batch: true });

    // Create wallet client reusing the chain config and RPC transport
    const walletClient = createWalletClient({
      account,
      chain: viemClient.chain,
      transport,
    });

    hash = await walletClient.writeContract({
      address: swapParams.address,
      abi: swapParams.abi,
      functionName: swapParams.functionName,
      args: swapParams.args,
      value: swapParams.value,
    });
  } else {
    await ensureConnectedChain({ config, chainId });
    // Use wagmi's writeContract for injected wallet transactions
    hash = await writeContract(config, swapParams);
  }

  if (!waitForReceipt) {
    return hash;
  }

  const receipt = await waitForTransactionReceipt(config, { hash });

  if (receipt.status !== "success") {
    throw new Error(`Swap transaction failed: ${receipt.status}`);
  }

  return hash;
}

export { Quote } from "./primitives";
