import { waitForTransactionReceipt } from "@wagmi/core";
import { formatUnits, parseUnits, publicActions, testActions } from "viem";
import { beforeAll, describe, expect, it } from "vitest";

import {
  checkHoneyStatus,
  getTestClientForChain,
  initDrome,
  TEST_ACCOUNT_ADDRESS,
} from "@/lib/test-helpers.js";

import { type Token } from "./primitives";
import { getChainConfig } from "./primitives/utils.js";
import {
  ensureTokenApproval,
  getCallDataForSwap,
  getQuoteForSwap,
  swap,
} from "./swap.js";
import { getListedTokens } from "./tokens.js";
import { getDefaultDrome } from "./utils.js";

// We'll create this dynamically in the test

async function wait(time: number) {
  return new Promise((res) => setTimeout(res, time));
}

interface TestContext {
  config: Awaited<ReturnType<typeof initDrome>>;
  supersimConfig: Awaited<ReturnType<typeof initDrome>>;
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
  beforeAll(async () => {
    // Check if honey is running correctly in the test setup phase
    const honeyStatus = await checkHoneyStatus();
    if (!honeyStatus) {
      console.warn(
        "⚠️ Honey may not be running properly. Tests may fail if they depend on local blockchain nodes."
      );
    }
  }, 30000); // 30 second timeout for honey startup

  test.only(
    "quote and swap from WETH to USDC",
    { retry: 3, timeout: 30000 },
    async ({ config, supersimConfig, tokens }) => {
      const supersim = getTestClientForChain(10);
      const c = supersimConfig
        .getClient({ chainId: 10 })
        .extend(testActions({ mode: "anvil" }))
        .extend(publicActions);

      console.log(
        "initial tx pool status",
        await supersim.getTxpoolStatus(),
        await supersim.getBlockNumber(),
        "---------------------",
        await c.getTxpoolStatus(),
        await c.getBlockNumber()
      );

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

      await ensureTokenApproval({
        config: supersimConfig,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: getChainConfig(supersimConfig.dromeConfig, 10)
          .UNIVERSAL_ROUTER_ADDRESS,
        amount: quote!.amount,
        chainId: 10,
      });

      console.log(
        "token approved",
        await supersim.getTxpoolStatus(),
        await supersim.getBlockNumber(),
        "---------------------",
        await c.getTxpoolStatus(),
        await c.getBlockNumber()
      );

      await supersim.mine({ blocks: 1 });

      console.log(
        "mined after approval",
        await supersim.getTxpoolStatus(),
        await supersim.getBlockNumber(),
        "---------------------",
        await c.getTxpoolStatus(),
        await c.getBlockNumber()
      );

      await wait(200);

      const hash = await swap({ config: supersimConfig, quote: quote! });
      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);

      console.log(
        "after swap",
        await supersim.getTxpoolStatus(),
        await supersim.getBlockNumber(),
        "---------------------",
        await c.getTxpoolStatus(),
        await c.getBlockNumber()
      );

      await supersim.mine({ blocks: 1 });

      console.log(
        "mined after swap",
        await supersim.getTxpoolStatus(),
        await supersim.getBlockNumber(),
        "---------------------",
        await c.getTxpoolStatus(),
        await c.getBlockNumber()
      );

      await wait(2000);

      const receipt = await waitForTransactionReceipt(supersimConfig, { hash });

      console.log(
        "after wait for transaction",
        await supersim.getTxpoolStatus(),
        await supersim.getBlockNumber(),
        "---------------------",
        await c.getTxpoolStatus(),
        await c.getBlockNumber()
      );

      expect(receipt.status).toBe("success");
    }
  );

  test(
    "quote and swap from VELO to USDC",
    { timeout: 30000, retry: 3 },
    async ({ config, supersimConfig, tokens }) => {
      const supersim = getTestClientForChain(10);

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

      await ensureTokenApproval({
        config: supersimConfig,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: getChainConfig(supersimConfig.dromeConfig, 10)
          .UNIVERSAL_ROUTER_ADDRESS,
        amount: quote!.amount,
        chainId: 10,
      });

      await supersim.mine({ blocks: 1 });

      const hash = await swap({
        config: supersimConfig,
        quote: quote!,
        slippagePct: "5",
      }); // 5% slippage tolerance
      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);

      await supersim.mine({ blocks: 1 });

      await wait(200);

      const receipt = await waitForTransactionReceipt(supersimConfig, { hash });

      expect(receipt.status).toBe("success");
    }
  );

  test(
    "quote and swap from ETH to VELO",
    { timeout: 30000, retry: 3 },
    async ({ config, supersimConfig, tokens }) => {
      const supersim = getTestClientForChain(10);

      const amountIn = parseUnits("0.1", tokens.eth.decimals);
      const quote = await getQuoteForSwap({
        config,
        fromToken: tokens.eth,
        toToken: tokens.velo,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.eth);
      expect(quote!.toToken).toEqual(tokens.velo);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);

      await ensureTokenApproval({
        config: supersimConfig,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: getChainConfig(supersimConfig.dromeConfig, 10)
          .UNIVERSAL_ROUTER_ADDRESS,
        amount: quote!.amount,
        chainId: 10,
      });

      await supersim.mine({ blocks: 1 });

      const hash = await swap({ config: supersimConfig, quote: quote! });
      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);

      await supersim.mine({ blocks: 1 });

      await wait(200);

      const receipt = await waitForTransactionReceipt(supersimConfig, { hash });

      expect(receipt.status).toBe("success");
    }
  );

  test(
    "quote and swap from VELO to ETH",
    { timeout: 30000, retry: 3 },
    async ({ config, supersimConfig, tokens }) => {
      const supersim = getTestClientForChain(10);

      const amountIn = parseUnits("1000", tokens.velo.decimals);
      const quote = await getQuoteForSwap({
        config,
        fromToken: tokens.velo,
        toToken: tokens.eth,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.velo);
      expect(quote!.toToken).toEqual(tokens.eth);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);

      await ensureTokenApproval({
        config: supersimConfig,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: getChainConfig(supersimConfig.dromeConfig, 10)
          .UNIVERSAL_ROUTER_ADDRESS,
        amount: quote!.amount,
        chainId: 10,
      });

      await supersim.mine({ blocks: 1 });

      const hash = await swap({ config: supersimConfig, quote: quote! });
      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);

      await supersim.mine({ blocks: 1 });

      await wait(200);

      const receipt = await waitForTransactionReceipt(supersimConfig, { hash });

      expect(receipt.status).toBe("success");
    }
  );

  test(
    "quote and swap from VELO to WETH",
    { timeout: 30000, retry: 3 },
    async ({ config, supersimConfig, tokens }) => {
      const supersim = getTestClientForChain(10);

      const amountIn = parseUnits("1000", tokens.velo.decimals);
      const quote = await getQuoteForSwap({
        config,
        fromToken: tokens.velo,
        toToken: tokens.weth,
        amountIn,
      });

      expect(quote).toBeTruthy();
      expect(quote!.fromToken).toEqual(tokens.velo);
      expect(quote!.toToken).toEqual(tokens.weth);
      expect(quote!.amount).toBe(amountIn);
      expect(quote!.amountOut).toBeGreaterThan(0n);
      expect(quote!.path).toBeDefined();
      expect(quote!.path.nodes).toBeInstanceOf(Array);
      expect(quote!.path.nodes.length).toBeGreaterThan(0);

      await ensureTokenApproval({
        config: supersimConfig,
        tokenAddress:
          quote!.fromToken.wrappedAddress || quote!.fromToken.address,
        spenderAddress: getChainConfig(supersimConfig.dromeConfig, 10)
          .UNIVERSAL_ROUTER_ADDRESS,
        amount: quote!.amount,
        chainId: 10,
      });

      await supersim.mine({ blocks: 1 });

      const hash = await swap({ config: supersimConfig, quote: quote! });
      expect(hash).toBeDefined();
      expect(hash.startsWith("0x")).toBe(true);

      await supersim.mine({ blocks: 1 });

      await wait(200);

      const receipt = await waitForTransactionReceipt(supersimConfig, { hash });

      expect(receipt.status).toBe("success");
    }
  );
});
