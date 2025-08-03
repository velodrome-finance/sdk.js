import {
  getAccount,
  readContract,
  readContracts,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { Hex, maxUint256 } from "viem";

import {
  depaginate,
  executeSwapParams,
  getBestQuote,
  getPaths,
  getPoolsForSwapParams,
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
  const { chainId, mustExcludeTokens, poolsPageSize } = getQuoteForSwapVars(
    config.dromeConfig,
    fromToken,
    toToken
  );

  const pools = await depaginate(
    (offset, count) =>
      readContract(
        config,
        getPoolsForSwapParams({
          config: config.dromeConfig,
          chainId,
          offset,
          count,
        })
      ),
    poolsPageSize
  );

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

  console.log(
    `Generated ${quotes.length} valid quotes from ${quoteResponses.length} paths`
  );

  const bestQuote = getBestQuote([quotes]);

  if (bestQuote) {
    console.log(
      `Best quote: AmountOut=${bestQuote.amountOut}, Path length=${bestQuote.path.nodes.length}`
    );
  }

  return bestQuote;
}

async function ensureTokenApproval(
  config: DromeWagmiConfig,
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint,
  chainId: number
) {
  const account = getAccount(config);
  console.log(`Checking allowance for account: ${account.address}`);

  // Check token balance first
  const balance = await readContract(config, {
    chainId,
    address: tokenAddress as Hex,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address!],
  });

  console.log(`Account balance: ${balance}, Required: ${amount}`);

  if (balance < amount) {
    throw new Error(
      `Insufficient token balance. Have ${balance}, need ${amount}`
    );
  }

  // Check current allowance
  const currentAllowance = await readContract(config, {
    chainId,
    address: tokenAddress as Hex,
    abi: erc20Abi,
    functionName: "allowance",
    args: [account.address!, spenderAddress as Hex],
  });

  console.log(`Current allowance: ${currentAllowance}, Required: ${amount}`);

  // If allowance is sufficient, no need to approve
  if (currentAllowance >= amount) {
    console.log("Allowance is sufficient, skipping approval");
    return;
  }

  console.log("Allowance insufficient, approving...");
  // Approve maximum amount to avoid frequent approvals
  const approveHash = await writeContract(config, {
    chainId,
    address: tokenAddress as Hex,
    abi: erc20Abi,
    functionName: "approve",
    args: [spenderAddress as Hex, maxUint256],
  });

  console.log(`Approval transaction hash: ${approveHash}`);
  // Wait for approval transaction to be mined
  await waitForTransactionReceipt(config, { hash: approveHash });
  console.log("Approval transaction mined");
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

  console.log(`Swap params:`, {
    address: swapParams.address,
    commands: planner.commands,
    inputs: planner.inputs,
    value: amount,
    fromToken: quote.fromToken.symbol,
    toToken: quote.toToken.symbol,
    amount: quote.amount,
  });

  // For ERC20 tokens (not native ETH), ensure approval before swap
  if (!quote.fromToken.wrappedAddress) {
    console.log(
      `Ensuring approval for ${quote.fromToken.symbol} (${quote.fromToken.address}) to Universal Router (${swapParams.address})`
    );
    console.log(`Amount: ${quote.amount}`);
    await ensureTokenApproval(
      config,
      quote.fromToken.address,
      swapParams.address,
      quote.amount,
      chainId
    );
    console.log("Approval completed successfully");
  }

  const hash = await writeContract(config, swapParams);

  const receipt = await waitForTransactionReceipt(config, { hash });
  console.log("Transaction receipt:", receipt);

  return hash;
}

export { Quote } from "./primitives";
