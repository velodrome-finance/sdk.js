import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { Hex } from "viem";

import { ChainParams } from "./utils.js";

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

export async function approve({
  config,
  tokenAddress,
  spenderAddress,
  amount,
  chainId,
  waitForReceipt = true,
}: ChainParams & {
  tokenAddress: string;
  spenderAddress: string;
  amount: bigint;
  waitForReceipt?: boolean;
}) {
  // TODO: check if approval is already sufficient
  const approveHash = await writeContract(config, {
    chainId,
    address: tokenAddress as Hex,
    abi: erc20Abi,
    functionName: "approve",
    args: [spenderAddress as Hex, amount],
  });

  if (waitForReceipt) {
    await waitForTransactionReceipt(config, { hash: approveHash });
  }

  return approveHash;
}
