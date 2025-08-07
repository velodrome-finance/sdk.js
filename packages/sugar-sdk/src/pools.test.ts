import { describe, expect, it } from "vitest";

import { initDrome } from "@/lib/test-helpers";

import { fetchPoolsForSwaps } from "./pools.js";

describe("fetchPoolsForSwaps", () => {
  it("should fetch reasonable number of pools for swaps", async () => {
    const pools = await fetchPoolsForSwaps(10, await initDrome());
    expect(pools).toBeDefined();
    // ballpark check for number of pools
    expect(pools.length).toBeGreaterThan(1300);
  });
});
