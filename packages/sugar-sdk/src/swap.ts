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

interface CallDataForSwap {
  commands: Hex;
  inputs: Hex[];
  minAmountOut: bigint;
  priceImpact: bigint;
}

interface CallDataForSwap {
  commands: Hex;
  inputs: Hex[];
  minAmountOut: bigint;
  priceImpact: bigint;
}

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

/**
 * Get unsigned transaction data for a swap that can be signed externally
 * @param config - Wagmi configuration
 * @param quote - Quote object from getQuoteForSwap
 * @param account - Address that will execute the swap
 * @param slippage - Slippage tolerance (0 to 1, default: 0.005 = 0.5%)
 * @returns Unsigned transaction data ready to be signed
 */
export async function getUnsignedSwapTransaction({
  config,
  quote,
  account,
  slippage = 0.005,
}: BaseParams & {
  quote: Quote;
  account: Address;
  slippage?: number;
}): Promise<UnsignedSwapTransaction> {
  if (slippage < 0 || slippage > 1) {
    throw new Error("Invalid slippage value. Should be between 0 and 1.");
  }

  const { chainId, planner, amount } = getSwapVars(
    config.sugarConfig,
    quote,
    `${Math.round(slippage * 100)}`,
    account
  );

  // Get the swap parameters
  const swapParams = executeSwapParams({
    config: config.sugarConfig,
    chainId,
    commands: planner.commands as Hex,
    inputs: planner.inputs as Hex[],
    value: amount,
  });

  // Encode the function call data
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

  const account = getAccount(config);
  if (!account.address) {
    throw new Error("No connected account found. Please connect a wallet.");
  }
  const accountAddress = account.address;

  const { chainId, planner, amount } = getSwapVars(
    config.sugarConfig,
    quote,
    typeof slippage !== "undefined"
      ? `${Math.round(slippage * 100)}`
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

  await ensureConnectedChain({ config, chainId });
  const hash = await writeContract(config, swapParams);

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
export type { UnsignedSwapTransaction };
