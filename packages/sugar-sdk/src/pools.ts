import { readContract } from "@wagmi/core";

import {
  getPoolsCountParams,
  getPoolsForSwapParams,
  paginate,
  PoolForSwap,
} from "./primitives/index.js";
import { ChainParams } from "./utils.js";

/**
 * Retrieves all liquidity pools available for swapping on the specified chain.
 *
 * Automatically handles pagination to fetch all pools efficiently, using optimal
 * batch sizes determined by the total pool count.
 *
 * @param params - Chain parameters
 * @param params.config - The Sugar SDK configuration
 * @param params.chainId - The chain ID to fetch pools from
 * @returns Promise that resolves to an array of PoolForSwap objects containing pool data optimized for swap routing
 *
 * @example
 * ```typescript
 * const pools = await getPoolsForSwaps({ config, chainId: 10 });
 * console.log(`Found ${pools.length} pools on Optimism`);
 * // Each pool in the array is of type PoolForSwap
 * ```
 */
export async function getPoolsForSwaps({
  config,
  chainId,
}: ChainParams): Promise<PoolForSwap[]> {
  const { limit, upperBound } = await getPoolsPagination({ config, chainId });

  const pools = await paginate<PoolForSwap>({
    limit,
    upperBound,
    fetchData: (pageSize, offset) =>
      readContract(
        config,
        getPoolsForSwapParams({
          config: config.sugarConfig,
          chainId,
          offset,
          count: pageSize,
        })
      ),
  });

  return [...pools];
}

/**
 * Calculates optimal pagination parameters for fetching pools from a chain.
 *
 * Determines the best page size based on total pool count to maximize efficiency
 * while avoiding gas limits. Aims for ~90 pools per batch for optimal performance.
 *
 * @param params - Chain parameters
 * @param params.config - The Sugar SDK configuration
 * @param params.chainId - The chain ID to calculate pagination for
 * @returns Promise that resolves to an object with `limit` (page size as number) and `upperBound` (total pool count as number)
 *
 * @internal
 */
export async function getPoolsPagination({
  config,
  chainId,
}: ChainParams): Promise<{ limit: number; upperBound: number }> {
  const poolCount = Number(
    (await readContract(
      config,
      getPoolsCountParams({
        config: config.sugarConfig,
        chainId,
      })
    )) + 10n
  ); // pad by 10 to avoid just in case there is a new pool in town during the session
  return {
    limit: Math.max(
      10, // for chains with few pools, we never fetch less than 10 pools
      Math.min(
        // ideally we want to load the batch call with ~90 calls, giving the best performance while staying below the 100 calls cap
        Math.floor(poolCount / 90),
        300 // but never more than 300 pools per call to avoid "out of gas"
      )
    ),
    upperBound: poolCount,
  };
}
