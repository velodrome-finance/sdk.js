import {
  getAccount,
  readContracts,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { Address, encodeFunctionData, Hex } from "viem";

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
    `${Math.round(slippage * 100)}`,
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
  batchSize = 50,
  concurrentLimit = 10,
}: BaseParams & {
  fromToken: Token;
  toToken: Token;
  amountIn: bigint;
  batchSize?: number;
  concurrentLimit?: number;
}) {
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
    batchSize,
    concurrentLimit,
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

interface UnsignedSwapTransaction {
  to: Address;
  data: Hex;
  value: bigint;
  chainId: number;
}

interface BaseSwapParams extends BaseParams {
  quote: Quote;
  slippage?: number;
}

interface SwapOptions extends BaseSwapParams {
  unsignedTransactionOnly?: false;
  waitForReceipt?: boolean;
  account?: Address; // Optional for when wallet is connected
}

interface UnsignedSwapOptions extends BaseSwapParams {
  unsignedTransactionOnly: true;
  account: Address; // Required for unsigned txs
  waitForReceipt?: never; // Can't be used with unsigned txs
}

export async function swap(options: SwapOptions): Promise<string>;
export async function swap(
  options: UnsignedSwapOptions
): Promise<UnsignedSwapTransaction>;

/**
 * Execute a swap or get unsigned transaction data for external signing
 * @param config - Wagmi configuration
 * @param quote - Quote object from getQuoteForSwap
 * @param slippage - Slippage tolerance (0 to 1, default: 0.005 = 0.5%)
 * @param unsignedTransactionOnly - If true, returns unsigned transaction data instead of executing
 * @param account - Address that will execute the swap (required when unsignedTransactionOnly=true)
 * @param waitForReceipt - Wait for transaction receipt (only applies when executing)
 * @returns Transaction hash (if executing) or unsigned transaction data (if unsignedTransactionOnly=true)
 */
export async function swap({
  config,
  quote,
  slippage = 0.005,
  unsignedTransactionOnly = false,
  account: providedAccount,
  waitForReceipt = true,
}: SwapOptions | UnsignedSwapOptions): Promise<
  string | UnsignedSwapTransaction
> {
  if (slippage < 0 || slippage > 1) {
    throw new Error("Invalid slippage value. Should be between 0 and 1.");
  }

  // Get account - either provided or from config
  let accountAddress: Address;
  if (unsignedTransactionOnly) {
    if (!providedAccount) {
      throw new Error(
        "account parameter is required when unsignedTransactionOnly=true"
      );
    }
    accountAddress = providedAccount;
  } else {
    const account = getAccount(config);
    if (!account.address) {
      throw new Error("No connected account found. Please connect a wallet.");
    }
    accountAddress = account.address;
  }

  const { chainId, planner, amount } = getSwapVars(
    config.sugarConfig,
    quote,
    `${Math.round(slippage * 100)}`,
    accountAddress
  );

  // Get the swap parameters
  const swapParams = executeSwapParams({
    config: config.sugarConfig,
    chainId,
    commands: planner.commands as Hex,
    inputs: planner.inputs as Hex[],
    value: amount,
  });

  // Return unsigned transaction if requested
  if (unsignedTransactionOnly) {
    const data = encodeFunctionData({
      abi: swapParams.abi,
      functionName: swapParams.functionName,
      args: swapParams.args,
    });

    return {
      to: swapParams.address,
      data,
      value: swapParams.value,
      chainId: swapParams.chainId,
    };
  }

  // Otherwise execute the swap
  await ensureConnectedChain({ config, chainId });
  const hash = await writeContract(config, swapParams);

  if (!waitForReceipt) {
    return hash;
  }

  const receipt = await waitForTransactionReceipt(config, { hash });

  if (receipt.status !== "success") {
    throw new Error(
      `Swap transaction failed: ${receipt.status}. Hash: ${hash}`
    );
  }

  return hash;
}

export { Quote } from "./primitives";
export type { UnsignedSwapTransaction };
