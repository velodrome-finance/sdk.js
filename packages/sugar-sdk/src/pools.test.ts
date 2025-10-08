import { describe, expect, it } from "vitest";

import { init } from "@/lib/test-helpers";

import { getPoolsForSwaps, getPoolsPagination } from "./pools.js";

describe("getPoolsForSwaps", () => {
  it("should fetch reasonable number of pools for swaps", async () => {
    const pools = await getPoolsForSwaps({
      chainId: 10,
      config: await init(),
    });
    expect(pools).toBeDefined();
    // ballpark check for number of pools
    expect(pools.length).toBeGreaterThan(1300);
  });
});

describe("getPoolsPagination", () => {
  it("derives pagination values from the pool count", async () => {
    const pagination = await getPoolsPagination({
      chainId: 10,
      config: await init(),
    });
    // ballpark check for number of pools
    expect(pagination.upperBound).toBeGreaterThan(1000);
    expect(pagination.limit).toBeLessThanOrEqual(300);
  });
});
