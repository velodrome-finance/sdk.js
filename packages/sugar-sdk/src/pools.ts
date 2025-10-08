import { readContract } from "@wagmi/core";

import {
  getPoolsCountParams,
  getPoolsForSwapParams,
  paginate,
  PoolForSwap,
} from "./primitives/index.js";
import { ChainParams } from "./utils.js";

export async function getPoolsForSwaps({ config, chainId }: ChainParams) {
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

export async function getPoolsPagination({ config, chainId }: ChainParams) {
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
