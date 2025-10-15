import {
  getClient,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { Address, createWalletClient, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

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
 * Supports two execution modes:
 * - With a connected wallet (via wagmi connectors)
 * - With a private key for direct transaction signing
 *
 * @param params - The approval parameters
 * @param params.config - The Wagmi configuration object
 * @param params.tokenAddress - The address of the ERC20 token contract to approve
 * @param params.spenderAddress - The address that will be approved to spend tokens
 * @param params.amount - The amount of tokens to approve (as bigint)
 * @param params.chainId - The chain ID where the approval should occur
 * @param params.waitForReceipt - Whether to wait for transaction confirmation (default: true)
 * @param params.privateKey - Optional private key for direct transaction signing. If provided, the approval will be executed using this key instead of a connected wallet
 *
 * @returns Promise that resolves to the transaction hash (Hex string) of the approval transaction
 *
 * @example
 * // Using a connected wallet
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
 *
 * @example
 * // Using a private key
 * ```typescript
 * const hash = await approve({
 *   config,
 *   tokenAddress: "0x...",
 *   spenderAddress: "0x...",
 *   amount: 1000000n,
 *   chainId: 10,
 *   privateKey: "0x..." as Hex, // Private key for signing
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
  privateKey,
}: ChainParams & {
  tokenAddress: Address;
  spenderAddress: Address;
  amount: bigint;
  waitForReceipt?: boolean;
  privateKey?: Hex;
}): Promise<Hex> {
  // TODO: check if approval is already sufficient
  let approveHash: Hex;

  if (privateKey) {
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

    approveHash = await walletClient.writeContract({
      address: tokenAddress as Hex,
      abi: erc20Abi,
      functionName: "approve",
      args: [spenderAddress as Hex, amount],
    });
  } else {
    // Use wagmi's writeContract for injected wallet transactions
    approveHash = await writeContract(config, {
      chainId,
      address: tokenAddress as Hex,
      abi: erc20Abi,
      functionName: "approve",
      args: [spenderAddress as Hex, amount],
    });
  }

  if (waitForReceipt) {
    await waitForTransactionReceipt(config, { hash: approveHash });
  }

  return approveHash;
}
