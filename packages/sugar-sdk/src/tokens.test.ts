import { describe, expect, it } from "vitest";

import { init } from "./lib/test-helpers.js";
import { getListedTokens } from "./tokens.js";

describe("Test fetching tokens", () => {
  it("should be able to fetch", async () => {
    const tokens = await getListedTokens({ config: await init() });
    // spot check common sense token count for OP
    expect(tokens.filter((t) => t.chainId === 10).length).toBeGreaterThan(80);
    // spot check common sense token count for Base
    expect(tokens.filter((t) => t.chainId === 8453).length).toBeGreaterThan(
      301
    );
  });
  it("should have tokens across supported chains", async () => {
    const tokens = await getListedTokens({ config: await init() });
    const chainIds = tokens.map((token) => token.chainId);
    expect(new Set(chainIds).size).toEqual(10);
    expect(chainIds).toContain(10);
    expect(chainIds).toContain(8453);
  });
});
