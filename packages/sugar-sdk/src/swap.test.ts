import { connect, getAccount } from "@wagmi/core";
import { parseUnits } from "viem";
import { beforeAll, describe, expect, it } from "vitest";

import { initDrome } from "./lib/test-helpers.js";
import { type Token } from "./primitives";
import { getQuoteForSwap } from "./swap.js";
import { getListedTokens } from "./tokens.js";

// Honey health check function
async function checkHoneyStatus(): Promise<boolean> {
  try {
    // Check if honey is running by testing connectivity to the expected ports
    const expectedPorts = [4444, 4445, 4446]; // OP, Lisk, Base based on honey.yaml

    for (const port of expectedPorts) {
      const response = await fetch(`http://localhost:${port}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
          id: 1,
        }),
      });

      if (!response.ok) {
        console.warn(`Honey port ${port} not responding`);
        return false;
      }
    }

    console.log("✅ Honey is running correctly on all expected ports");
    return true;
  } catch (error) {
    console.warn("⚠️ Honey connectivity check failed:", error);
    return false;
  }
}

interface TestContext {
  config: ReturnType<typeof initDrome>;
  simnetConfig: ReturnType<typeof initDrome>;
  tokens: {
    velo: Token;
    weth: Token;
    usdc: Token;
    eth: Token;
  };
}

const test = it.extend<TestContext>({
  // eslint-disable-next-line no-empty-pattern
  config: async ({}, use) => {
    const config = initDrome();
    await use(config);
  },
  // eslint-disable-next-line no-empty-pattern
  simnetConfig: async ({}, use) => {
    const config = initDrome(true);
    await use(config);
  },
  tokens: async ({ config }, use) => {
    const allTokens = await getListedTokens(config);

    const findToken = (symbol: string, chainId: number) =>
      allTokens.find(
        (token) =>
          token.symbol.toLowerCase() === symbol.toLowerCase() &&
          token.chainId === chainId
      );

    const velo = findToken("velo", 10);
    const weth = findToken("weth", 10);
    const usdc = findToken("usdc", 10);
    const eth = findToken("eth", 10);

    if (!velo) throw new Error("Could not find VELO token for testing");
    if (!weth) throw new Error("Could not find WETH token for testing");
    if (!usdc) throw new Error("Could not find USDC token for testing");
    if (!eth) throw new Error("Could not find ETH token for testing");

    const tokens = { velo, weth, usdc, eth };
    await use(tokens);
  },
});

describe("Test swap functionality", () => {
  beforeAll(async () => {
    // Check if honey is running correctly in the test setup phase
    const honeyStatus = await checkHoneyStatus();
    if (!honeyStatus) {
      console.warn(
        "⚠️ Honey may not be running properly. Tests may fail if they depend on local blockchain nodes."
      );
    }
  }, 30000); // 30 second timeout for honey startup

  // test.concurrent(
  //   "should get a quote for a valid swap",
  //   async ({ config, tokens }) => {
  //     const amountIn = parseUnits("1", tokens.weth.decimals);
  //     const quote = await getQuoteForSwap(
  //       config,
  //       tokens.weth,
  //       tokens.usdc,
  //       amountIn
  //     );

  //     expect(quote).toBeTruthy();
  //     expect(quote!.fromToken).toEqual(tokens.weth);
  //     expect(quote!.toToken).toEqual(tokens.usdc);
  //     expect(quote!.amount).toBe(amountIn);
  //     expect(quote!.amountOut).toBeGreaterThan(0n);
  //     expect(quote!.path).toBeDefined();
  //     expect(quote!.path.nodes).toBeInstanceOf(Array);
  //     expect(quote!.path.nodes.length).toBeGreaterThan(0);
  //   }
  // );

  test.concurrent(
    "quote and swap from VELO to USDC",
    async ({ config, simnetConfig, tokens }) => {
      // Connect to the mock connector first
      await connect(simnetConfig, { connector: simnetConfig.connectors[1] });

      const account = getAccount(simnetConfig);

      expect(account.address).toEqual(
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      );

      const amountIn = parseUnits("100", tokens.velo.decimals);
      const quote = await getQuoteForSwap(
        config,
        tokens.velo,
        tokens.usdc,
        amountIn
      );

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.velo);
      expect(quote!.toToken).toEqual(tokens.usdc);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);

      expect(simnetConfig.chains[1].rpcUrls.default.http).toEqual([
        "http://localhost:4444",
      ]);

      // const r = await swap(simnetConfig, quote!);
      // console.log("Swap result:", r);
      // expect(r).toBeDefined();
    }
  );

  // test.concurrent(
  //   "should get a quote for eth to velo swap",
  //   async ({ config, tokens }) => {
  //     const amountIn = parseUnits("0.1", tokens.eth.decimals);
  //     const quote = await getQuoteForSwap(
  //       config,
  //       tokens.eth,
  //       tokens.velo,
  //       amountIn
  //     );

  //     expect(quote).toBeTruthy();
  //     expect(quote!.fromToken).toEqual(tokens.eth);
  //     expect(quote!.toToken).toEqual(tokens.velo);
  //     expect(quote!.amount).toBe(amountIn);
  //     expect(quote!.amountOut).toBeGreaterThan(0n);
  //     expect(quote!.path).toBeDefined();
  //     expect(quote!.path.nodes).toBeInstanceOf(Array);
  //     expect(quote!.path.nodes.length).toBeGreaterThan(0);
  //   }
  // );

  // test.concurrent(
  //   "should get a quote for velo to eth swap",
  //   async ({ config, tokens }) => {
  //     const amountIn = parseUnits("1000", tokens.velo.decimals);
  //     const quote = await getQuoteForSwap(
  //       config,
  //       tokens.velo,
  //       tokens.eth,
  //       amountIn
  //     );

  //     expect(quote).toBeTruthy();
  //     expect(quote!.fromToken).toEqual(tokens.velo);
  //     expect(quote!.toToken).toEqual(tokens.eth);
  //     expect(quote!.amount).toBe(amountIn);
  //     expect(quote!.amountOut).toBeGreaterThan(0n);
  //     expect(quote!.path).toBeDefined();
  //     expect(quote!.path.nodes).toBeInstanceOf(Array);
  //     expect(quote!.path.nodes.length).toBeGreaterThan(0);
  //   }
  // );

  // test.concurrent(
  //   "should get a quote for velo to weth swap",
  //   async ({ config, tokens }) => {
  //     const amountIn = parseUnits("1000", tokens.velo.decimals);
  //     const quote = await getQuoteForSwap(
  //       config,
  //       tokens.velo,
  //       tokens.weth,
  //       amountIn
  //     );

  //     expect(quote).toBeTruthy();
  //     expect(quote!.fromToken).toEqual(tokens.velo);
  //     expect(quote!.toToken).toEqual(tokens.weth);
  //     expect(quote!.amount).toBe(amountIn);
  //     expect(quote!.amountOut).toBeGreaterThan(0n);
  //     expect(quote!.path).toBeDefined();
  //     expect(quote!.path.nodes).toBeInstanceOf(Array);
  //     expect(quote!.path.nodes.length).toBeGreaterThan(0);
  //   }
  // );

  // test.concurrent(
  //   "should get a quote for weth to velo swap",
  //   async ({ config, tokens }) => {
  //     const amountIn = parseUnits("1", tokens.weth.decimals);
  //     const quote = await getQuoteForSwap(
  //       config,
  //       tokens.weth,
  //       tokens.velo,
  //       amountIn
  //     );

  //     expect(quote).toBeTruthy();
  //     expect(quote!.fromToken).toEqual(tokens.weth);
  //     expect(quote!.toToken).toEqual(tokens.velo);
  //     expect(quote!.amount).toBe(amountIn);
  //     expect(quote!.amountOut).toBeGreaterThan(0n);
  //     expect(quote!.path).toBeDefined();
  //     expect(quote!.path.nodes).toBeInstanceOf(Array);
  //     expect(quote!.path.nodes.length).toBeGreaterThan(0);
  //   }
  // );
});
