import { ContractFunctionReturnType } from "viem";

import { Config } from "../config.js";
import { lpSugarAbi } from "./abis.js";
import { ContractFunction, getChainConfig } from "./utils.js";

/**
 * Builds contract call parameters for getting the total pool count.
 *
 * @template ChainId The chain ID type
 * @param params - Parameters
 * @param params.config - The SDK configuration
 * @param params.chainId - The chain ID to query
 * @returns ContractFunction object containing parameters for calling the LP Sugar count function
 *
 * @internal
 */
export function getPoolsCountParams<ChainId extends number>({
  config,
  chainId,
}: {
  config: Config;
  chainId: ChainId;
}) {
  return {
    chainId,
    address: getChainConfig(config, chainId).LP_SUGAR_ADDRESS,
    abi: lpSugarAbi,
    functionName: "count",
    args: [],
  } satisfies ContractFunction<typeof lpSugarAbi, "view", "count">;
}

/**
 * Builds contract call parameters for fetching a page of pools.
 *
 * Returns parameters for calling the LP Sugar contract's "all" function,
 * which retrieves detailed information about liquidity pools.
 *
 * @template ChainId The chain ID type
 * @param params - Parameters
 * @param params.config - The SDK configuration
 * @param params.chainId - The chain ID to query
 * @param params.offset - The starting index in the pool list
 * @param params.count - The number of pools to return
 * @returns ContractFunction object containing parameters for calling the LP Sugar all function
 *
 * @internal
 */
export function getPoolsParams<ChainId extends number>({
  config,
  chainId,
  offset,
  count,
}: {
  config: Config;
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

/**
 * Builds contract call parameters for fetching pools optimized for swap routing.
 *
 * Returns parameters for calling the LP Sugar contract's "forSwaps" function,
 * which retrieves pool data in a format optimized for calculating swap routes.
 *
 * @template ChainId The chain ID type
 * @param params - Parameters
 * @param params.config - The SDK configuration
 * @param params.chainId - The chain ID to query
 * @param params.offset - The starting index in the pool list
 * @param params.count - The number of pools to return
 * @returns ContractFunction object containing parameters for calling the LP Sugar forSwaps function
 *
 * @internal
 */
export function getPoolsForSwapParams<ChainId extends number>({
  config,
  chainId,
  offset,
  count,
}: {
  config: Config;
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

/**
 * Type representing a single pool's data optimized for swap routing.
 * Extracted from the LP Sugar contract's forSwaps function return type.
 */
export type PoolForSwap = ContractFunctionReturnType<
  typeof lpSugarAbi,
  "view",
  "forSwaps"
>[0];
