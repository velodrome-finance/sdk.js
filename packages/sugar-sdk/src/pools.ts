import { readContract } from "@wagmi/core";

import { getPoolsForSwapParams, PoolForSwap } from "./primitives/index.js";
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
