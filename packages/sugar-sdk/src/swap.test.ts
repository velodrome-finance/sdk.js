import { disconnect } from "@wagmi/core";
import { formatUnits, parseUnits } from "viem";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  checkHoneyStatus,
  initDrome,
  TEST_ACCOUNT_ADDRESS,
} from "@/lib/test-helpers.js";

import { type Token } from "./primitives";
import { getCallDataForSwap, getQuoteForSwap, swap } from "./swap.js";
import { getListedTokens } from "./tokens.js";
import { getDefaultDrome } from "./utils.js";

// describe("Swap tests with proper isolation", () => {

//   beforeEach(async () => {
//     // 1. Take blockchain snapshot
//     const response = await fetch("http://localhost:4444", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         jsonrpc: "2.0",
//         method: "evm_snapshot",
//         params: [],
//         id: 1,
//       }),
//     });
//     const { result } = await response.json();
//     snapshotId = result;

//     // 2. Create fresh config with new nonce manager
//     freshConfig = await initDrome(true);

//     // 3. Ensure account is connected
//     await connect(freshConfig, {
//       connector: freshConfig.connectors[1],
//     });
//   });

//   afterEach(async () => {
//     // 1. Disconnect account
//     await disconnect(freshConfig);

//     // 2. Revert blockchain state
//     await fetch("http://localhost:4444", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         jsonrpc: "2.0",
//         method: "evm_revert",
//         params: [snapshotId],
//         id: 1,
//       }),
//     });
//   });

//   it("should swap without nonce conflicts", async () => {
//     // Test uses freshConfig, guaranteed clean state
//     const quote = await getQuoteForSwap({
//       config: freshConfig,
//       // ...
//     });

//     const result = await swap({
//       config: freshConfig,
//       quote,
//     });

//     expect(result).toBeDefined();
//   });
// });

interface TestContext {
  config: Awaited<ReturnType<typeof initDrome>>;
  // supersimConfig: Awaited<ReturnType<typeof initDrome>>;
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
    const config = await initDrome();
    await use(config);
  },

  // supersimConfig: async ({}, use) => {
  //   const supersimConfig = await initDrome(true);
  //   await use(supersimConfig);
  // },
  tokens: async ({ config }, use) => {
    const allTokens = await getListedTokens({ config });

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

describe("getCallDataForSwap", () => {
  test("works", async ({ tokens }) => {
    const callData = await getCallDataForSwap({
      config: getDefaultDrome(),
      fromToken: tokens.usdc,
      toToken: tokens.velo,
      amountIn: parseUnits("100", tokens.usdc.decimals),
      account: TEST_ACCOUNT_ADDRESS,
      slippage: 0.01,
    });
    const pi = formatUnits(callData.priceImpact, 18);
    // make sure price impact is in decimals for % (ie 2% is 0.02 not 2.0)
    expect(parseFloat(pi)).toBeLessThan(0.01);
  });
});

describe("Test swap functionality", () => {
  let supersimConfig: Awaited<ReturnType<typeof initDrome>>;

  beforeAll(async () => {
    // Check if honey is running correctly in the test setup phase
    const honeyStatus = await checkHoneyStatus();
    if (!honeyStatus) {
      console.warn(
        "⚠️ Honey may not be running properly. Tests may fail if they depend on local blockchain nodes."
      );
    }
  }, 30000); // 30 second timeout for honey startup

  beforeEach(async () => {
    // 1. Take blockchain snapshot
    // const response = await fetch("http://localhost:4444", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     jsonrpc: "2.0",
    //     method: "evm_snapshot",
    //     params: [],
    //     id: 1,
    //   }),
    // });

    // const { result } = await response.json();
    // snapshotId = result;

    // const automine = await fetch("http://localhost:4444", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     jsonrpc: "2.0",
    //     method: "evm_setAutomine",
    //     params: [true],
    //     id: 2,
    //   }),
    // });

    // 2. Create fresh config with new nonce manager
    supersimConfig = await initDrome(true);
  });

  afterEach(async () => {
    // 1. Disconnect account
    await disconnect(supersimConfig);

    // // 2. Revert blockchain state
    // await fetch("http://localhost:4444", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     jsonrpc: "2.0",
    //     method: "evm_revert",
    //     params: [snapshotId],
    //     id: 1,
    //   }),
    // });
  });

  test(
    "quote and swap from WETH to USDC",
    { retry: 3, timeout: 30000 },
    async ({ config, tokens }) => {
      const amountIn = parseUnits("1", tokens.weth.decimals);
      const quote = await getQuoteForSwap({
        config,
        fromToken: tokens.weth,
        toToken: tokens.usdc,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.weth);
      expect(quote!.toToken).toEqual(tokens.usdc);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);

      const r = await swap({ config: supersimConfig, quote: quote! });
      expect(r).toBeDefined();
      expect(r.startsWith("0x")).toBe(true);
    }
  );

  test(
    "quote and swap from VELO to USDC",
    { timeout: 30000, retry: 3 },
    async ({ config, tokens }) => {
      const amountIn = parseUnits("100", tokens.velo.decimals);
      const quote = await getQuoteForSwap({
        config,
        fromToken: tokens.velo,
        toToken: tokens.usdc,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.velo);
      expect(quote!.toToken).toEqual(tokens.usdc);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);

      const r = await swap({
        config: supersimConfig,
        quote: quote!,
        slippagePct: "5",
      }); // 5% slippage tolerance
      expect(r).toBeDefined();
      expect(r.startsWith("0x")).toBe(true);
    }
  );

  // test(
  //   "quote and swap from ETH to VELO",
  //   { timeout: 30000, retry: 3 },
  //   async ({ config, supersimConfig, tokens }) => {
  //     const amountIn = parseUnits("0.1", tokens.eth.decimals);
  //     const quote = await getQuoteForSwap({
  //       config,
  //       fromToken: tokens.eth,
  //       toToken: tokens.velo,
  //       amountIn,
  //     });

  //     expect(quote).toBeTruthy();
  //     expect(quote!.fromToken).toEqual(tokens.eth);
  //     expect(quote!.toToken).toEqual(tokens.velo);
  //     expect(quote!.amount).toBe(amountIn);
  //     expect(quote!.amountOut).toBeGreaterThan(0n);
  //     expect(quote!.path).toBeDefined();
  //     expect(quote!.path.nodes).toBeInstanceOf(Array);
  //     expect(quote!.path.nodes.length).toBeGreaterThan(0);

  //     const r = await swap({ config: supersimConfig, quote: quote! });
  //     expect(r).toBeDefined();
  //     expect(r.startsWith("0x")).toBe(true);
  //   }
  // );

  // test(
  //   "quote and swap from VELO to ETH",
  //   { timeout: 30000, retry: 3 },
  //   async ({ config, supersimConfig, tokens }) => {
  //     const amountIn = parseUnits("1000", tokens.velo.decimals);
  //     const quote = await getQuoteForSwap({
  //       config,
  //       fromToken: tokens.velo,
  //       toToken: tokens.eth,
  //       amountIn,
  //     });

  //     expect(quote).toBeTruthy();
  //     expect(quote!.fromToken).toEqual(tokens.velo);
  //     expect(quote!.toToken).toEqual(tokens.eth);
  //     expect(quote!.amount).toBe(amountIn);
  //     expect(quote!.amountOut).toBeGreaterThan(0n);
  //     expect(quote!.path).toBeDefined();
  //     expect(quote!.path.nodes).toBeInstanceOf(Array);
  //     expect(quote!.path.nodes.length).toBeGreaterThan(0);

  //     const r = await swap({ config: supersimConfig, quote: quote! });
  //     expect(r).toBeDefined();
  //     expect(r.startsWith("0x")).toBe(true);
  //   }
  // );

  // test(
  //   "quote and swap from VELO to WETH",
  //   { timeout: 30000, retry: 3 },
  //   async ({ config, supersimConfig, tokens }) => {
  //     const amountIn = parseUnits("1000", tokens.velo.decimals);
  //     const quote = await getQuoteForSwap({
  //       config,
  //       fromToken: tokens.velo,
  //       toToken: tokens.weth,
  //       amountIn,
  //     });

  //     expect(quote).toBeTruthy();
  //     expect(quote!.fromToken).toEqual(tokens.velo);
  //     expect(quote!.toToken).toEqual(tokens.weth);
  //     expect(quote!.amount).toBe(amountIn);
  //     expect(quote!.amountOut).toBeGreaterThan(0n);
  //     expect(quote!.path).toBeDefined();
  //     expect(quote!.path.nodes).toBeInstanceOf(Array);
  //     expect(quote!.path.nodes.length).toBeGreaterThan(0);

  //     const r = await swap({ config: supersimConfig, quote: quote! });
  //     expect(r).toBeDefined();
  //     expect(r.startsWith("0x")).toBe(true);
  //   }
  // );
});
