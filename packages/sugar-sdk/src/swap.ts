import {
  getAccount,
  readContracts,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { Hex } from "viem";

import { getPoolsForSwaps } from "./pools.js";
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
import { DromeWagmiConfig, ensureConnectedChain } from "./utils.js";

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

export async function getQuoteForSwap(
  config: DromeWagmiConfig,
  fromToken: Token,
  toToken: Token,
  amountIn: bigint
) {
  const { chainId, mustExcludeTokens } = getQuoteForSwapVars(
    config.dromeConfig,
    fromToken,
    toToken
  );
  const pools = await getPoolsForSwaps(chainId, config);

  const paths = getPaths({
    config: config.dromeConfig,
    pools,
    fromToken,
    toToken,
    mustExcludeTokens,
    chainId,
  });

  if (paths.length === 0) {
    return null;
  }

  const quoteResponses = await readContracts(config, {
    contracts: paths.map((path) =>
      getSwapQuoteParams({
        config: config.dromeConfig,
        chainId,
        path: path.nodes,
        amountIn,
      })
    ),
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
          } as Quote);
    })
    .filter((quote) => quote !== null);

  return getBestQuote([quotes]);
}

async function ensureTokenApproval(
  config: DromeWagmiConfig,
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint,
  chainId: number
) {
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

export async function swap(
  config: DromeWagmiConfig,
  quote: Quote,
  slippagePct?: string
) {
  const account = getAccount(config);
  const { chainId, planner, amount } = getSwapVars(
    config.dromeConfig,
    quote,
    slippagePct,
    account.address
  );

  await ensureConnectedChain(config, chainId);

  // Get the Universal Router address from the execute params
  const swapParams = executeSwapParams({
    config: config.dromeConfig,
    chainId,
    commands: planner.commands as Hex,
    inputs: planner.inputs as Hex[],
    value: amount,
  });

  await ensureTokenApproval(
    config,
    quote.fromToken.wrappedAddress || quote.fromToken.address,
    swapParams.address,
    quote.amount,
    chainId
  );

  const hash = await writeContract(config, swapParams);
  const receipt = await waitForTransactionReceipt(config, { hash });

  if (receipt.status !== "success") {
    throw new Error(`Swap transaction failed: ${receipt.status}`);
  }

  return hash;
}

export { Quote } from "./primitives";
