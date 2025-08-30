import { formatUnits, parseUnits } from "viem";
import { describe, expect, it } from "vitest";

import { initDrome, TEST_ACCOUNT_ADDRESS } from "@/lib/test-helpers.js";

import { type Token } from "./primitives";
// Import the swap functions
import { getCallDataForSwap } from "./swap.js";
import { getListedTokens } from "./tokens.js";
import { getDefaultDrome } from "./utils.js";

interface TestContext {
  config: Awaited<ReturnType<typeof initDrome>>;
  supersimConfig: Awaited<ReturnType<typeof initDrome>>;
  tokens: {
    opVelo: Token;
    opWeth: Token;
    opUsdc: Token;
    opEth: Token;
    baseAero: Token;
    baseUsdc: Token;
  };
}

const test = it.extend<TestContext>({
  // eslint-disable-next-line no-empty-pattern
  config: async ({}, use) => {
    const config = await initDrome();
    await use(config);
  },
  // eslint-disable-next-line no-empty-pattern
  supersimConfig: async ({}, use) => {
    const supersimConfig = await initDrome(true);
    await use(supersimConfig);
  },
  tokens: async ({ config }, use) => {
    const allTokens = await getListedTokens({ config });

    const findToken = (symbol: string, chainId: number) =>
      allTokens.find(
        (token) =>
          token.symbol.toLowerCase() === symbol.toLowerCase() &&
          token.chainId === chainId
      );

    const opVelo = findToken("velo", 10);
    const opWeth = findToken("weth", 10);
    const opUsdc = findToken("usdc", 10);
    const opEth = findToken("eth", 10);
    const baseAero = findToken("aero", 8453);
    const baseUsdc = findToken("usdc", 8453);

    if (!opVelo) throw new Error("Could not find VELO token for testing (OP)");
    if (!opWeth) throw new Error("Could not find WETH token for testing (OP)");
    if (!opUsdc) throw new Error("Could not find USDC token for testing (OP)");
    if (!opEth) throw new Error("Could not find ETH token for testing (OP)");
    if (!baseAero)
      throw new Error("Could not find BASE AERO token for testing (Base)");
    if (!baseUsdc)
      throw new Error("Could not find BASE USDC token for testing (Base)");

    const tokens = { opVelo, opWeth, opUsdc, opEth, baseAero, baseUsdc };
    await use(tokens);
  },
});

describe("getCallDataForSwap", () => {
  test("works for OP", { timeout: 10000 }, async ({ tokens }) => {
    const callData = await getCallDataForSwap({
      config: getDefaultDrome(),
      fromToken: tokens.opUsdc,
      toToken: tokens.opVelo,
      amountIn: parseUnits("100", tokens.opUsdc.decimals),
      account: TEST_ACCOUNT_ADDRESS,
      slippage: 0.01,
    });
    expect(callData).not.toBeNull();
    const pi = formatUnits(callData!.priceImpact, 18);
    // make sure price impact is in decimals for % (ie 2% is 0.02 not 2.0)
    expect(Math.abs(parseFloat(pi))).toBeLessThan(0.01);
  });

  test("works for Base", { timeout: 20000 }, async ({ tokens }) => {
    const callData = await getCallDataForSwap({
      config: getDefaultDrome(),
      fromToken: tokens.baseAero,
      toToken: tokens.baseUsdc,
      amountIn: parseUnits("100", tokens.baseAero.decimals),
      account: TEST_ACCOUNT_ADDRESS,
      slippage: 0.01,
    });
    expect(callData).not.toBeNull();
    const pi = formatUnits(callData!.priceImpact, 18);
    // make sure price impact is in decimals for % (ie 2% is 0.02 not 2.0)
    expect(Math.abs(parseFloat(pi))).toBeLessThan(0.01);
  });

  test("handles invalid slippage values", async ({ tokens }) => {
    await expect(
      getCallDataForSwap({
        config: getDefaultDrome(),
        fromToken: tokens.opUsdc,
        toToken: tokens.opVelo,
        amountIn: parseUnits("100", tokens.opUsdc.decimals),
        account: TEST_ACCOUNT_ADDRESS,
        slippage: -0.01, // Invalid slippage (negative)
      })
    ).rejects.toThrow("Invalid slippage value. Should be between 0 and 1.");

    await expect(
      getCallDataForSwap({
        config: getDefaultDrome(),
        fromToken: tokens.opUsdc,
        toToken: tokens.opVelo,
        amountIn: parseUnits("100", tokens.opUsdc.decimals),
        account: TEST_ACCOUNT_ADDRESS,
        slippage: 1.1, // Invalid slippage (> 1)
      })
    ).rejects.toThrow("Invalid slippage value. Should be between 0 and 1.");
  });

  test("handles missing quotes", async ({ tokens }) => {
    const d = await getCallDataForSwap({
      config: getDefaultDrome(),
      fromToken: Object.assign({}, tokens.opUsdc, {
        // not a real token
        address: "0x7f9adfbd38b669f03d1d11000bc76b9aaea28a81",
      }),
      toToken: tokens.opVelo,
      amountIn: parseUnits("100", tokens.opUsdc.decimals),
      account: TEST_ACCOUNT_ADDRESS,
      slippage: 0.01,
    });
    expect(d).toBeNull();
  });
});

// describe("Test swap functionality", () => {
//   beforeAll(async () => {
//     // Check if honey is running correctly in the test setup phase
//     const honeyStatus = await checkHoneyStatus();
//     if (!honeyStatus) {
//       console.warn(
//         "⚠️ Honey may not be running properly. Tests may fail if they depend on local blockchain nodes."
//       );
//     }
//   }, 30000); // 30 second timeout for honey startup

//   test(
//     "quote and swap from WETH to USDC",
//     { retry: 3, timeout: 30000 },
//     async ({ config, supersimConfig, tokens }) => {
//       const amountIn = parseUnits("1", tokens.weth.decimals);
//       const quote = await getQuoteForSwap({
//         config,
//         fromToken: tokens.weth,
//         toToken: tokens.usdc,
//         amountIn,
//       });

//       expect(quote).toBeTruthy();
//       expect(quote!.fromToken).toEqual(tokens.weth);
//       expect(quote!.toToken).toEqual(tokens.usdc);
//       expect(quote!.amount).toBe(amountIn);
//       expect(quote!.amountOut).toBeGreaterThan(0n);
//       expect(quote!.path).toBeDefined();
//       expect(quote!.path.nodes).toBeInstanceOf(Array);
//       expect(quote!.path.nodes.length).toBeGreaterThan(0);

//       const r = await swap({ config: supersimConfig, quote: quote! });
//       expect(r).toBeDefined();
//       expect(r.startsWith("0x")).toBe(true);
//     }
//   );

//   test(
//     "quote and swap from VELO to USDC",
//     { timeout: 30000, retry: 3 },
//     async ({ config, supersimConfig, tokens }) => {
//       const amountIn = parseUnits("100", tokens.velo.decimals);
//       const quote = await getQuoteForSwap({
//         config,
//         fromToken: tokens.velo,
//         toToken: tokens.usdc,
//         amountIn,
//       });

//       expect(quote).toBeTruthy();
//       expect(quote!.fromToken).toEqual(tokens.velo);
//       expect(quote!.toToken).toEqual(tokens.usdc);
//       expect(quote!.amount).toBe(amountIn);
//       expect(quote!.amountOut).toBeGreaterThan(0n);
//       expect(quote!.path).toBeDefined();
//       expect(quote!.path.nodes).toBeInstanceOf(Array);
//       expect(quote!.path.nodes.length).toBeGreaterThan(0);

//       const r = await swap({
//         config: supersimConfig,
//         quote: quote!,
//         slippagePct: "5",
//       }); // 5% slippage tolerance
//       expect(r).toBeDefined();
//       expect(r.startsWith("0x")).toBe(true);
//     }
//   );

//   test(
//     "quote and swap from ETH to VELO",
//     { timeout: 30000, retry: 3 },
//     async ({ config, supersimConfig, tokens }) => {
//       const amountIn = parseUnits("0.1", tokens.eth.decimals);
//       const quote = await getQuoteForSwap({
//         config,
//         fromToken: tokens.eth,
//         toToken: tokens.velo,
//         amountIn,
//       });

//       expect(quote).toBeTruthy();
//       expect(quote!.fromToken).toEqual(tokens.eth);
//       expect(quote!.toToken).toEqual(tokens.velo);
//       expect(quote!.amount).toBe(amountIn);
//       expect(quote!.amountOut).toBeGreaterThan(0n);
//       expect(quote!.path).toBeDefined();
//       expect(quote!.path.nodes).toBeInstanceOf(Array);
//       expect(quote!.path.nodes.length).toBeGreaterThan(0);

//       const r = await swap({ config: supersimConfig, quote: quote! });
//       expect(r).toBeDefined();
//       expect(r.startsWith("0x")).toBe(true);
//     }
//   );

//   test(
//     "quote and swap from VELO to ETH",
//     { timeout: 30000, retry: 3 },
//     async ({ config, supersimConfig, tokens }) => {
//       const amountIn = parseUnits("1000", tokens.velo.decimals);
//       const quote = await getQuoteForSwap({
//         config,
//         fromToken: tokens.velo,
//         toToken: tokens.eth,
//         amountIn,
//       });

//       expect(quote).toBeTruthy();
//       expect(quote!.fromToken).toEqual(tokens.velo);
//       expect(quote!.toToken).toEqual(tokens.eth);
//       expect(quote!.amount).toBe(amountIn);
//       expect(quote!.amountOut).toBeGreaterThan(0n);
//       expect(quote!.path).toBeDefined();
//       expect(quote!.path.nodes).toBeInstanceOf(Array);
//       expect(quote!.path.nodes.length).toBeGreaterThan(0);

//       const r = await swap({ config: supersimConfig, quote: quote! });
//       expect(r).toBeDefined();
//       expect(r.startsWith("0x")).toBe(true);
//     }
//   );

//   test(
//     "quote and swap from VELO to WETH",
//     { timeout: 30000, retry: 3 },
//     async ({ config, supersimConfig, tokens }) => {
//       const amountIn = parseUnits("1000", tokens.velo.decimals);
//       const quote = await getQuoteForSwap({
//         config,
//         fromToken: tokens.velo,
//         toToken: tokens.weth,
//         amountIn,
//       });

//       expect(quote).toBeTruthy();
//       expect(quote!.fromToken).toEqual(tokens.velo);
//       expect(quote!.toToken).toEqual(tokens.weth);
//       expect(quote!.amount).toBe(amountIn);
//       expect(quote!.amountOut).toBeGreaterThan(0n);
//       expect(quote!.path).toBeDefined();
//       expect(quote!.path.nodes).toBeInstanceOf(Array);
//       expect(quote!.path.nodes.length).toBeGreaterThan(0);

//       const r = await swap({ config: supersimConfig, quote: quote! });
//       expect(r).toBeDefined();
//       expect(r.startsWith("0x")).toBe(true);
//     }
//   );
// });
