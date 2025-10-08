import { readContract } from "@wagmi/core";

import {
  getPoolsCountParams,
  getPoolsForSwapParams,
  PoolForSwap,
} from "./primitives/index.js";
import { ChainParams } from "./utils.js";

export async function getPoolsForSwaps({ config, chainId }: ChainParams) {
  let offset = 0;
  let result: PoolForSwap[] = [];
  let finished = false;

  while (!finished) {
    const pools = await readContract(
      config,
      getPoolsForSwapParams({
        config: config.sugarConfig,
        chainId,
        offset,
        count: config.sugarConfig.POOLS_PAGE_SIZE,
      })
    );
    offset += config.sugarConfig.POOLS_PAGE_SIZE;
    result = result.concat(pools);
    if (pools.length === 0) {
      finished = true;
    }
  }
  return result;
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
