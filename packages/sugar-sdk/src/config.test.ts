import { describe, expect, it } from "vitest";

import {
  base,
  baseConfig,
  celo,
  fraxtal,
  getDefaultConfig,
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

describe("getDefaultConfig", () => {
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

    const config = getDefaultConfig({
      chains: chains.map((chain) => {
        const rpcUrl = import.meta.env[`VITE_RPC_URL_${chain.id}`];
        if (!rpcUrl) {
          throw new Error(`Missing RPC URL for chain ${chain.id}`);
        }
        return {
          chain,
          rpcUrl,
        };
      }),
    });
    expect(config.sugarConfig.chains.length).toEqual(chains.length);
    for (const chain of chains) {
      expect(
        config.sugarConfig.chains.some((c) => c.CHAIN.id === chain.id)
      ).toBe(true);
    }
  });

  it("works for base", () => {
    const config = getDefaultConfig({
      chains: [{ chain: base, rpcUrl: "https://mainnet.base.org/" }],
    });
    expect(config.sugarConfig.chains.length).toEqual(1);
    expect(config.sugarConfig.chains[0].CHAIN.id).toEqual(base.id);
  });

  it("accepts and stores privateKey", () => {
    const testPrivateKey =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`;
    const config = getDefaultConfig({
      chains: [{ chain: base, rpcUrl: "https://mainnet.base.org/" }],
      privateKey: testPrivateKey,
    });
    expect(config.sugarConfig.privateKey).toEqual(testPrivateKey);
  });

  it("works without privateKey", () => {
    const config = getDefaultConfig({
      chains: [{ chain: base, rpcUrl: "https://mainnet.base.org/" }],
    });
    expect(config.sugarConfig.privateKey).toBeUndefined();
  });
});
