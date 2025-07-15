import { ContractFunctionReturnType } from "viem";

import { DromeConfig } from "../config.js";
import { lpSugarAbi } from "./abis.js";
import { ContractFunction, getChainConfig } from "./utils.js";

/**
 * Gets a section from the list of all pools.
 * @param chainId The target chain id.
 * @param offset The offset in the pool list.
 * @param length The amount of pools to return.
 * @returns The requested pools.
 */
export function getPoolsParams<ChainId extends number>({
  config,
  chainId,
  offset,
  count,
}: {
  config: DromeConfig;
  chainId: ChainId;
  offset: number;
  count: number;
}) {
  return {
    chainId,
    address: getChainConfig(config, chainId).LP_SUGAR_ADDRESS,
    abi: lpSugarAbi,
    functionName: "all",
    args: [BigInt(count), BigInt(offset)],
  } satisfies ContractFunction<typeof lpSugarAbi, "view", "all">;
}

export function getPoolsForSwapParams<ChainId extends number>({
  config,
  chainId,
  offset,
  count,
}: {
  config: DromeConfig;
  chainId: ChainId;
  offset: number;
  count: number;
}) {
  return {
    chainId,
    address: getChainConfig(config, chainId).LP_SUGAR_ADDRESS,
    abi: lpSugarAbi,
    functionName: "forSwaps",
    args: [BigInt(count), BigInt(offset)],
  } satisfies ContractFunction<typeof lpSugarAbi, "view", "forSwaps">;
}

export type PoolForSwap = ContractFunctionReturnType<
  typeof lpSugarAbi,
  "view",
  "forSwaps"
>[0];
