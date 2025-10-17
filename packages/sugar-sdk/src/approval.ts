import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { Address, Hex } from "viem";

import { ChainParams } from "./utils.js";

/**
 * ERC20 ABI containing essential token functions for approvals and balance checks.
 * Includes approve, allowance, and balanceOf function definitions.
 */
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

/**
 * Approves a spender to transfer a specified amount of tokens on behalf of the caller.
 *
 * This function writes an ERC20 approval transaction to the blockchain, allowing
 * the specified spender address to transfer up to the given amount of tokens from
 * the caller's account.
 *
 * Requires a connected wallet via wagmi connectors.
 *
 * @param params - The approval parameters
 * @param params.config - The Wagmi configuration object
 * @param params.tokenAddress - The address of the ERC20 token contract to approve
 * @param params.spenderAddress - The address that will be approved to spend tokens
 * @param params.amount - The amount of tokens to approve (as bigint)
 * @param params.chainId - The chain ID where the approval should occur
 * @param params.waitForReceipt - Whether to wait for transaction confirmation (default: true)
 *
 * @returns Promise that resolves to the transaction hash (Hex string) of the approval transaction
 *
 * @example
 * ```typescript
 * const hash = await approve({
 *   config,
 *   tokenAddress: "0x...",
 *   spenderAddress: "0x...",
 *   amount: 1000000n,
 *   chainId: 10,
 * });
 * // hash is of type Hex (e.g., "0x1234...")
 * ```
 */
export async function approve({
  config,
  tokenAddress,
  spenderAddress,
  amount,
  chainId,
  waitForReceipt = true,
}: ChainParams & {
  tokenAddress: Address;
  spenderAddress: Address;
  amount: bigint;
  waitForReceipt?: boolean;
}): Promise<Hex> {
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
