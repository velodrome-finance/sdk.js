import {
  getAccount,
  readContracts,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { Address, Hex } from "viem";

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
  processBatchesConcurrently,
  writeContractWithConfig,
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
 * - With a private key for direct transaction signing (configured via `getDefaultConfig`)
 *
 * @param params - Swap execution parameters
 * @param params.config - The Sugar SDK configuration
 * @param params.quote - The swap quote to execute (from getQuoteForSwap)
 * @param params.slippage - Slippage tolerance as decimal between 0 and 1 (e.g., 0.005 for 0.5%, default: 0.005)
 * @param params.waitForReceipt - Whether to wait for transaction confirmation (default: true)
 * @returns Promise that resolves to the transaction hash as a string
 * @throws Error if the transaction fails or is reverted
 * @throws Error if no connected account is found and no private key is configured
 *
 * @example
 * // Using a connected wallet
 * ```typescript
 * const config = getDefaultConfig({ chains: [{ chain: optimism, rpcUrl: "..." }] });
 * const quote = await getQuoteForSwap({ config, fromToken, toToken, amountIn });
 * const txHash = await swap({
 *   config,
 *   quote,
 *   slippage: 0.005, // 0.5% slippage
 * });
 * console.log(`Swap executed: ${txHash}`);
 * // txHash: string (e.g., "0x1234...")
 * ```
 *
 * @example
 * // Using a private key (configured in getDefaultConfig)
 * ```typescript
 * const config = getDefaultConfig({
 *   chains: [{ chain: optimism, rpcUrl: "..." }],
 *   privateKey: "0x..." as `0x${string}`
 * });
 * const quote = await getQuoteForSwap({ config, fromToken, toToken, amountIn });
 * const txHash = await swap({
 *   config,
 *   quote,
 *   slippage: 0.005, // 0.5% slippage
 * });
 * console.log(`Swap executed: ${txHash}`);
 * ```
 */
export async function swap({
  config,
  quote,
  slippage = 0.005,
  waitForReceipt = true,
}: BaseParams & {
  quote: Quote;
  slippage?: number;
  waitForReceipt?: boolean;
}): Promise<string> {
  if (typeof slippage !== "undefined" && (slippage < 0 || slippage > 1)) {
    throw new Error("Invalid slippage value. Should be between 0 and 1.");
  }

  // Determine account address based on whether privateKey is configured
  let accountAddress: Address;
  const { privateKey } = config.sugarConfig;

  if (privateKey) {
    // Use account address from private key
    const { privateKeyToAccount } = await import("viem/accounts");
    const account = privateKeyToAccount(privateKey);
    accountAddress = account.address;
  } else {
    // Use connected wallet account
    const account = getAccount(config);
    if (!account.address) {
      throw new Error(
        "No connected account found. Please connect a wallet or configure a private key."
      );
    }
    accountAddress = account.address;
  }

  const { chainId, planner, amount } = getSwapVars(
    config.sugarConfig,
    quote,
    typeof slippage !== "undefined"
      ? `${Math.ceil(slippage * 100)}`
      : undefined,
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

  // Use the helper to write the contract
  const hash = await writeContractWithConfig({
    config,
    chainId,
    contractParams: {
      address: swapParams.address,
      abi: swapParams.abi,
      functionName: swapParams.functionName,
      args: swapParams.args,
      value: swapParams.value,
    },
  });

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
