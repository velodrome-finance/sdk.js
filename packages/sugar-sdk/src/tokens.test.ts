import { describe, expect, it } from "vitest";

import { base, getDefaultConfig } from "./config.js";
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
    const uniqueChainIds = Array.from(new Set(chainIds)).sort((a, b) => a - b);
    const expectedChainIds = [
      10, // Optimism
      130, // Unichain
      252, // Fraxtal
      1135, // Lisk
      1750, // Metal L2
      1868, // Soneium
      1923, // Swellchain
      5330, // Superseed
      8453, // Base
      34443, // Mode
      42220, // Celo
      57073, // Ink
    ];

    expect(uniqueChainIds).toEqual(expectedChainIds);
  });
  it("should work with a subset of chains", async () => {
    const config = getDefaultConfig({
      chains: [
        { chain: base, rpcUrl: import.meta.env[`VITE_RPC_URL_${base.id}`] },
      ],
    });
    const tokens = await getListedTokens({ config });
    const chainIds = tokens.map((token) => token.chainId);
    expect(new Set(chainIds).size).toEqual(1);
    expect(chainIds).toContain(base.id);
  });
});
