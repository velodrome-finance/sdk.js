import {
  getAccount,
  readContracts,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { splitEvery } from "ramda";
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
import { BaseParams, ChainParams, ensureConnectedChain } from "./utils.js";

// ERC20 ABI for approve and allowance functions
const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

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
    `${slippage * 100}`,
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
}: BaseParams & {
  fromToken: Token;
  toToken: Token;
  amountIn: bigint;
}) {
  const { chainId, mustExcludeTokens } = getQuoteForSwapVars(
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

  const pathsBatches = splitEvery(50, paths);
  const concurrentBatchSize = 10; // Process 10 batches at a time

  const quoteResponses = [];

  for (let i = 0; i < pathsBatches.length; i += concurrentBatchSize) {
    const batchGroup = pathsBatches.slice(i, i + concurrentBatchSize);
    const batchPromises = batchGroup.map((batch) =>
      readContracts(config, {
        contracts: batch.map((path) =>
          getSwapQuoteParams({
            config: config.sugarConfig,
            chainId,
            path: path.nodes,
            amountIn,
          })
        ),
      })
    );

    const batchResults = await Promise.all(batchPromises);
    quoteResponses.push(...batchResults.flat());
  }

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
          } as Quote);
    })
    .filter((quote) => quote !== null);

  return getBestQuote([quotes]);
}

async function ensureTokenApproval({
  config,
  tokenAddress,
  spenderAddress,
  amount,
  chainId,
}: ChainParams & {
  tokenAddress: string;
  spenderAddress: string;
  amount: bigint;
}) {
  // TODO: check if approval is already sufficient
  const approveHash = await writeContract(config, {
    chainId,
    address: tokenAddress as Hex,
    abi: erc20Abi,
    functionName: "approve",
    args: [spenderAddress as Hex, amount],
  });
  await waitForTransactionReceipt(config, { hash: approveHash });
}

export async function swap({
  config,
  quote,
  slippagePct,
}: BaseParams & {
  quote: Quote;
  slippagePct?: string;
}) {
  const account = getAccount(config);
  const { chainId, planner, amount } = getSwapVars(
    config.sugarConfig,
    quote,
    slippagePct,
    account.address
  );

  await ensureConnectedChain({ config, chainId });

  // Get the Universal Router address from the execute params
  const swapParams = executeSwapParams({
    config: config.sugarConfig,
    chainId,
    commands: planner.commands as Hex,
    inputs: planner.inputs as Hex[],
    value: amount,
  });

  await ensureTokenApproval({
    config,
    tokenAddress: quote.fromToken.wrappedAddress || quote.fromToken.address,
    spenderAddress: swapParams.address,
    amount: quote.amount,
    chainId,
  });

  const hash = await writeContract(config, swapParams);
  const receipt = await waitForTransactionReceipt(config, { hash });

  if (receipt.status !== "success") {
    throw new Error(`Swap transaction failed: ${receipt.status}`);
  }

  return hash;
}

export { Quote } from "./primitives";
