import { connect } from "@wagmi/core";
import { formatUnits, parseUnits } from "viem";
import { mine, setBalance } from "viem/actions";
import { beforeAll, describe, expect, it } from "vitest";

import { init } from "@/lib/test-helpers.js";
import { anvilBase } from "~test/src/anvil.js";
import { accounts } from "~test/src/constants.js";

import { approve } from "./approval.js";
import { initWithAnvil } from "./lib/test-helpers.js";
import { type Token } from "./primitives/index.js";
import { getCallDataForSwap, getQuoteForSwap, swap } from "./swap.js";
import { getListedTokens } from "./tokens.js";

interface TestContext {
  config: Awaited<ReturnType<typeof init>>;
  readonlyConfig: Awaited<ReturnType<typeof init>>;
  tokens: {
    opVelo: Token;
    opWeth: Token;
    opUsdc: Token;
    opEth: Token;
    baseAero: Token;
    baseUsdc: Token;
    baseWeth: Token;
    baseEth: Token;
  };
}

const test = it.extend<TestContext>({
  // eslint-disable-next-line no-empty-pattern
  config: async ({}, use) => {
    const config = await initWithAnvil(anvilBase);
    await connect(config, { connector: config.connectors[1] });

    await use(config);
  },
  // eslint-disable-next-line no-empty-pattern
  readonlyConfig: async ({}, use) => {
    const config = await init();
    await use(config);
  },
  tokens: async ({ readonlyConfig }, use) => {
    const allTokens = await getListedTokens({ config: readonlyConfig });

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
    const baseWeth = findToken("weth", 8453);
    const baseEth = findToken("eth", 8453);

    if (!opVelo) throw new Error("Could not find VELO token for testing (OP)");
    if (!opWeth) throw new Error("Could not find WETH token for testing (OP)");
    if (!opUsdc) throw new Error("Could not find USDC token for testing (OP)");
    if (!opEth) throw new Error("Could not find ETH token for testing (OP)");
    if (!baseAero)
      throw new Error("Could not find BASE AERO token for testing (Base)");
    if (!baseUsdc)
      throw new Error("Could not find BASE USDC token for testing (Base)");
    if (!baseWeth)
      throw new Error("Could not find BASE WETH token for testing (Base)");
    if (!baseEth)
      throw new Error("Could not find BASE ETH token for testing (Base)");

    const tokens = {
      opVelo,
      opWeth,
      opUsdc,
      opEth,
      baseAero,
      baseUsdc,
      baseWeth,
      baseEth,
    };
    await use(tokens);
  },
});

describe("getCallDataForSwap", () => {
  test(
    "works for Base",
    { timeout: 20000 },
    async ({ readonlyConfig, tokens }) => {
      const callData = await getCallDataForSwap({
        config: readonlyConfig,
        fromToken: tokens.baseAero,
        toToken: tokens.baseUsdc,
        amountIn: parseUnits("100", tokens.baseAero.decimals),
        account: accounts[0].address,
        slippage: 0.01,
      });
      expect(callData).not.toBeNull();
      const pi = formatUnits(callData!.priceImpact, 18);
      // make sure price impact is in decimals for % (ie 2% is 0.02 not 2.0)
      expect(Math.abs(parseFloat(pi))).toBeLessThan(0.01);
    }
  );

  test("handles invalid slippage values", async ({
    readonlyConfig,
    tokens,
  }) => {
    await expect(
      getCallDataForSwap({
        config: readonlyConfig,
        fromToken: tokens.baseUsdc,
        toToken: tokens.baseAero,
        amountIn: parseUnits("100", tokens.baseUsdc.decimals),
        account: accounts[0].address,
        slippage: -0.01, // Invalid slippage (negative)
      })
    ).rejects.toThrow("Invalid slippage value. Should be between 0 and 1.");

    await expect(
      getCallDataForSwap({
        config: readonlyConfig,
        fromToken: tokens.baseUsdc,
        toToken: tokens.baseAero,
        amountIn: parseUnits("100", tokens.baseUsdc.decimals),
        account: accounts[0].address,
        slippage: 1.1, // Invalid slippage (> 1)
      })
    ).rejects.toThrow("Invalid slippage value. Should be between 0 and 1.");
  });

  test("handles missing quotes", async ({ readonlyConfig, tokens }) => {
    const d = await getCallDataForSwap({
      config: readonlyConfig,
      fromToken: Object.assign({}, tokens.baseUsdc, {
        // not a real token
        address: "0x7f9adfbd38b669f03d1d11000bc76b9aaea28a81",
      }),
      toToken: tokens.baseAero,
      amountIn: parseUnits("100", tokens.baseUsdc.decimals),
      account: accounts[0].address,
      slippage: 0.01,
    });
    expect(d).toBeNull();
  });
});

describe("Test swap functionality with Anvil", () => {
  let client: ReturnType<typeof anvilBase.getClient>;

  beforeAll(async () => {
    // Get a client for Base Anvil instance
    client = anvilBase.getClient();

    // Fund test accounts with ETH
    for (const account of accounts.slice(0, 3)) {
      await setBalance(client, {
        address: account.address,
        value: parseUnits("10000", 18),
      });
    }

    // Mine a block to apply the changes
    await mine(client, { blocks: 1 });
  }, 30000);

  test(
    "quote and swap from AERO to USDC",
    { timeout: 30000 },
    async ({ config, readonlyConfig, tokens }) => {
      const amountIn = parseUnits("100", tokens.baseAero.decimals);
      const quote = await getQuoteForSwap({
        config: readonlyConfig,
        fromToken: tokens.baseAero,
        toToken: tokens.baseUsdc,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.baseAero);
      expect(quote!.toToken).toEqual(tokens.baseUsdc);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);
      expect(quote!.spenderAddress).toBeDefined();

      // Approve tokens before swap using private key
      await approve({
        config,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
        waitForReceipt: false,
      });

      // Mine the approval transaction
      await mine(client, { blocks: 1 });

      // Execute swap using private key
      const hash = await swap({
        config,
        quote: quote!,
        waitForReceipt: false,
      });

      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);

      // Mine the swap transaction
      await mine(client, { blocks: 1 });
    }
  );

  test(
    "quote and swap from ETH to AERO",
    { timeout: 30000 },
    async ({ config, readonlyConfig, tokens }) => {
      const amountIn = parseUnits("0.1", tokens.baseEth.decimals);
      const quote = await getQuoteForSwap({
        config: readonlyConfig,
        fromToken: tokens.baseEth,
        toToken: tokens.baseAero,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.baseEth);
      expect(quote!.toToken).toEqual(tokens.baseAero);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);

      // For ETH swaps, approval is not needed, just execute swap
      const hash = await swap({
        config,
        quote: quote!,
        waitForReceipt: false,
      });

      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);

      // Mine the transaction
      await mine(client, { blocks: 1 });
    }
  );

  test(
    "swap without waiting for receipt",
    { timeout: 30000 },
    async ({ config, readonlyConfig, tokens }) => {
      const amountIn = parseUnits("50", tokens.baseAero.decimals);
      const quote = await getQuoteForSwap({
        config: readonlyConfig,
        fromToken: tokens.baseAero,
        toToken: tokens.baseUsdc,
        amountIn,
      });

      expect(quote).toBeTruthy();

      // Approve tokens before swap
      await approve({
        config,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
        waitForReceipt: false,
      });

      await mine(client, { blocks: 1 });

      // Call swap without waiting for receipt
      const hash = await swap({
        config,
        quote: quote!,
        waitForReceipt: false,
      });

      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);
      // Hash should be returned immediately without waiting for confirmation

      // Mine manually
      await mine(client, { blocks: 1 });
    }
  );

  test(
    "separate approval and swap",
    { timeout: 30000 },
    async ({ config, readonlyConfig, tokens }) => {
      const amountIn = parseUnits("100", tokens.baseWeth.decimals);
      const quote = await getQuoteForSwap({
        config: readonlyConfig,
        fromToken: tokens.baseWeth,
        toToken: tokens.baseUsdc,
        amountIn,
      });

      expect(quote).toBeTruthy();

      // Manually approve tokens before swap
      await approve({
        config,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: quote!.spenderAddress,
        amount: quote!.amount,
        chainId: quote!.fromToken.chainId,
        waitForReceipt: false,
      });

      await mine(client, { blocks: 1 });

      const hash = await swap({
        config,
        quote: quote!,
        waitForReceipt: false,
      });

      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);

      await mine(client, { blocks: 1 });
    }
  );
});
