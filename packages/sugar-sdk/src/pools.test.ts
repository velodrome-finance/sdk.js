import { describe, expect, it } from "vitest";

import { initDrome } from "@/lib/test-helpers";

import { getPoolsForSwaps } from "./pools.js";

describe("getPoolsForSwaps", () => {
  it("should fetch reasonable number of pools for swaps", async () => {
    const pools = await getPoolsForSwaps({
      chainId: 10,
      config: await initDrome(),
    });
    expect(pools).toBeDefined();
    // ballpark check for number of pools
    expect(pools.length).toBeGreaterThan(1300);
  });
});
