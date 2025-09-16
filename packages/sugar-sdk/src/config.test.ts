import { describe, expect, it } from "vitest";

import {
  base,
  baseConfig,
  celo,
  fraxtal,
  getDefaultDrome,
  ink,
  lisk,
  metalL2,
  mode,
  optimism,
  soneium,
  superseed,
  supportedChains,
  swellchain,
  unichain,
} from "./config.js";

describe("config supportedChains", () => {
  it("is ordered by chain id ascending order", () => {
    const ids = supportedChains.map((c) => c.id);
    const sorted = [...ids].sort((a, b) => a - b);
    expect(ids).toEqual(sorted);
  });
});

describe("config baseConfig", () => {
  it("has configs for all supported chains", () => {
    expect(supportedChains.length).toEqual(baseConfig.chains.length);
    const ids = supportedChains.map((c) => c.id);
    for (const id of ids) {
      expect(baseConfig.chains.some((c) => c.CHAIN.id === id)).toBe(true);
    }
  });
});

describe("getDefaultDrome", () => {
  it("works for velodrome chain subset", () => {
    const chains = [
      celo,
      fraxtal,
      ink,
      lisk,
      metalL2,
      mode,
      optimism,
      soneium,
      superseed,
      swellchain,
      unichain,
    ];

    const drome = getDefaultDrome({
      chains: chains.map((chain) => {
        const rpcUrl = import.meta.env[`VITE_RPC_URI_${chain.id}`];
        if (!rpcUrl) {
          throw new Error(`Missing RPC URI for chain ${chain.id}`);
        }
        return {
          chain,
          rpcUrl,
        };
      }),
    });
    expect(drome.sugarConfig.chains.length).toEqual(chains.length);
    for (const chain of chains) {
      expect(
        drome.sugarConfig.chains.some((c) => c.CHAIN.id === chain.id)
      ).toBe(true);
    }
  });

  it("works for base", () => {
    const drome = getDefaultDrome({
      chains: [{ chain: base, rpcUrl: "https://mainnet.base.org/" }],
    });
    expect(drome.sugarConfig.chains.length).toEqual(1);
    expect(drome.sugarConfig.chains[0].CHAIN.id).toEqual(base.id);
  });
});
