import { formatUnits, parseUnits } from "viem";
import { beforeAll, describe, expect, it } from "vitest";

import {
  checkHoneyStatus,
  init,
  TEST_ACCOUNT_ADDRESS,
} from "@/lib/test-helpers.js";

import { approve } from "./approval.js";
import { type Token } from "./primitives/index.js";
// Import the swap functions
import { getCallDataForSwap, getQuoteForSwap, swap } from "./swap.js";
import { getListedTokens } from "./tokens.js";

interface TestContext {
  config: Awaited<ReturnType<typeof init>>;
  supersimConfig: Awaited<ReturnType<typeof init>>;
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
    const config = await init();
    await use(config);
  },
  // eslint-disable-next-line no-empty-pattern
  supersimConfig: async ({}, use) => {
    const supersimConfig = await init(true);
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
  test("works for OP", { timeout: 10000 }, async ({ config, tokens }) => {
    const callData = await getCallDataForSwap({
      config,
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

  test("works for Base", { timeout: 20000 }, async ({ config, tokens }) => {
    const callData = await getCallDataForSwap({
      config,
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

  test("handles invalid slippage values", async ({ config, tokens }) => {
    await expect(
      getCallDataForSwap({
        config,
        fromToken: tokens.opUsdc,
        toToken: tokens.opVelo,
        amountIn: parseUnits("100", tokens.opUsdc.decimals),
        account: TEST_ACCOUNT_ADDRESS,
        slippage: -0.01, // Invalid slippage (negative)
      })
    ).rejects.toThrow("Invalid slippage value. Should be between 0 and 1.");

    await expect(
      getCallDataForSwap({
        config,
        fromToken: tokens.opUsdc,
        toToken: tokens.opVelo,
        amountIn: parseUnits("100", tokens.opUsdc.decimals),
        account: TEST_ACCOUNT_ADDRESS,
        slippage: 1.1, // Invalid slippage (> 1)
      })
    ).rejects.toThrow("Invalid slippage value. Should be between 0 and 1.");
  });

  test("handles missing quotes", async ({ config, tokens }) => {
    const d = await getCallDataForSwap({
      config,
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

  test(
    "quote and swap from WETH to USDC",
    { timeout: 30000 },
    async ({ config, supersimConfig, tokens }) => {
      const amountIn = parseUnits("1", tokens.opWeth.decimals);
      const quote = await getQuoteForSwap({
        config,
        fromToken: tokens.opWeth,
        toToken: tokens.opUsdc,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.opWeth);
      expect(quote!.toToken).toEqual(tokens.opUsdc);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);
      expect(quote!.spenderAddress).toBeDefined();

      // Approve tokens before swap
      await approve({
        config: supersimConfig,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
      });

      const r = await swap({ config: supersimConfig, quote: quote! });
      expect(r).toBeDefined();
      expect(r.startsWith("0x")).toBe(true);
    }
  );

  test(
    "quote and swap from VELO to USDC",
    { timeout: 30000 },
    async ({ config, supersimConfig, tokens }) => {
      const amountIn = parseUnits("100", tokens.opVelo.decimals);
      const quote = await getQuoteForSwap({
        config,
        fromToken: tokens.opVelo,
        toToken: tokens.opUsdc,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.opVelo);
      expect(quote!.toToken).toEqual(tokens.opUsdc);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);

      // Approve tokens before swap
      await approve({
        config: supersimConfig,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
      });

      const r = await swap({
        config: supersimConfig,
        quote: quote!,
        slippagePct: "5",
      }); // 5% slippage tolerance

      expect(r).toBeDefined();
      expect(r.startsWith("0x")).toBe(true);
    }
  );

  test(
    "quote and swap from ETH to VELO",
    { timeout: 30000 },
    async ({ config, supersimConfig, tokens }) => {
      const amountIn = parseUnits("0.1", tokens.opEth.decimals);
      const quote = await getQuoteForSwap({
        config,
        fromToken: tokens.opEth,
        toToken: tokens.opVelo,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.opEth);
      expect(quote!.toToken).toEqual(tokens.opVelo);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);

      // Approve tokens before swap
      await approve({
        config: supersimConfig,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
      });

      const r = await swap({ config: supersimConfig, quote: quote! });
      expect(r).toBeDefined();
      expect(r.startsWith("0x")).toBe(true);
    }
  );

  test(
    "quote and swap from VELO to ETH",
    { timeout: 30000 },
    async ({ config, supersimConfig, tokens }) => {
      const amountIn = parseUnits("1000", tokens.opVelo.decimals);
      const quote = await getQuoteForSwap({
        config,
        fromToken: tokens.opVelo,
        toToken: tokens.opEth,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.opVelo);
      expect(quote!.toToken).toEqual(tokens.opEth);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);

      // Approve tokens before swap
      await approve({
        config: supersimConfig,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
      });

      const r = await swap({ config: supersimConfig, quote: quote! });
      expect(r).toBeDefined();
      expect(r.startsWith("0x")).toBe(true);
    }
  );

  test(
    "quote and swap from VELO to WETH",
    { timeout: 30000 },
    async ({ config, supersimConfig, tokens }) => {
      const amountIn = parseUnits("1000", tokens.opVelo.decimals);
      const quote = await getQuoteForSwap({
        config,
        fromToken: tokens.opVelo,
        toToken: tokens.opWeth,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.opVelo);
      expect(quote!.toToken).toEqual(tokens.opWeth);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);

      // Approve tokens before swap
      await approve({
        config: supersimConfig,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
      });

      const r = await swap({ config: supersimConfig, quote: quote! });
      expect(r).toBeDefined();
      expect(r.startsWith("0x")).toBe(true);
    }
  );

  test(
    "swap without waiting for receipt",
    { timeout: 30000 },
    async ({ config, supersimConfig, tokens }) => {
      const amountIn = parseUnits("100", tokens.opVelo.decimals);
      const quote = await getQuoteForSwap({
        config,
        fromToken: tokens.opVelo,
        toToken: tokens.opUsdc,
        amountIn,
      });

      expect(quote).toBeTruthy();

      // Approve tokens before swap
      await approve({
        config: supersimConfig,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
      });

      // Call swap without waiting for receipt
      const hash = await swap({
        config: supersimConfig,
        quote: quote!,
        waitForReceipt: false,
      });

      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);
      // Hash should be returned immediately without waiting for confirmation
    }
  );

  test(
    "separate approval and swap",
    { timeout: 30000 },
    async ({ config, supersimConfig, tokens }) => {
      const amountIn = parseUnits("1", tokens.opWeth.decimals);
      const quote = await getQuoteForSwap({
        config,
        fromToken: tokens.opWeth,
        toToken: tokens.opUsdc,
        amountIn,
      });

      expect(quote).toBeTruthy();

      // Manually approve tokens before swap - demonstrating separate approval workflow
      await approve({
        config: supersimConfig,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
      });

      const hash = await swap({
        config: supersimConfig,
        quote: quote!,
      });

      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);
    }
  );
});
