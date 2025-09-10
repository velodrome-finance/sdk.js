import { describe, expect, it } from "vitest";

import {
  base,
  baseDromeConfig,
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

describe("config baseDromeConfig", () => {
  it("has configs for all supported chains", () => {
    expect(supportedChains.length).toEqual(baseDromeConfig.chains.length);
    const ids = supportedChains.map((c) => c.id);
    for (const id of ids) {
      expect(baseDromeConfig.chains.some((c) => c.CHAIN.id === id)).toBe(true);
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
      chains: chains.map((chain) => ({
        chain,
        rpcUrls: process.env[`VITE_RPC_URIS_${chain.id}`]!.split(",").map(
          // TODDO: deal with ":N" suffixes for priorities
          (rpc: string) => rpc.slice(0, rpc.lastIndexOf(":"))
        ),
      })),
    });
    expect(drome.dromeConfig.chains.length).toEqual(chains.length);
    for (const chain of chains) {
      expect(
        drome.dromeConfig.chains.some((c) => c.CHAIN.id === chain.id)
      ).toBe(true);
    }
  });

  it("works for base", () => {
    const drome = getDefaultDrome({
      chains: [{ chain: base, rpcUrls: ["https://mainnet.base.org/"] }],
    });
    expect(drome.dromeConfig.chains.length).toEqual(1);
    expect(drome.dromeConfig.chains[0].CHAIN.id).toEqual(base.id);
  });
});
