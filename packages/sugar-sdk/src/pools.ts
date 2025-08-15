import { readContract } from "@wagmi/core";

import { getPoolsForSwapParams, PoolForSwap } from "./primitives/index.js";
import { DromeWagmiConfig } from "./utils.js";

export async function getPoolsForSwaps(
  chainId: number,
  config: DromeWagmiConfig
) {
  let offset = 0;
  let result: PoolForSwap[] = [];
  let finished = false;

  while (!finished) {
    const pools = await readContract(
      config,
      getPoolsForSwapParams({
        config: config.dromeConfig,
        chainId,
        offset,
        count: config.dromeConfig.POOLS_PAGE_SIZE,
      })
    );
    offset += config.dromeConfig.POOLS_PAGE_SIZE;
    result = result.concat(pools);
    if (pools.length === 0) {
      finished = true;
    }
  }
  return result;
}
