import { ContractFunctionReturnType } from "viem";
import { getChainConfig } from "../utils.js";
import { lpSugarAbi } from "./abis.js";
import { ContractFunction } from "./utils.js";

/**
 * Gets a section from the list of all pools.
 * @param chainId The target chain id.
 * @param offset The offset in the pool list.
 * @param length The amount of pools to return.
 * @returns The requested pools.
 */
export function getPoolsParams<ChainId extends number>(
  chainId: ChainId,
  offset: number,
  length: number
) {
  return {
    chainId,
    address: getChainConfig(chainId).LP_SUGAR_ADDRESS,
    abi: lpSugarAbi,
    functionName: "all",
    args: [BigInt(length), BigInt(offset)],
  } satisfies ContractFunction<typeof lpSugarAbi, "view", "all">;
}

export function getPoolsForSwapParams<ChainId extends number>(
  chainId: ChainId,
  offset: number,
  length: number
) {
  return {
    chainId,
    address: getChainConfig(chainId).LP_SUGAR_ADDRESS,
    abi: lpSugarAbi,
    functionName: "forSwaps",
    args: [BigInt(length), BigInt(offset)],
  } satisfies ContractFunction<typeof lpSugarAbi, "view", "forSwaps">;
}

export type PoolForSwap = ContractFunctionReturnType<
  typeof lpSugarAbi,
  "view",
  "forSwaps"
>[0];
