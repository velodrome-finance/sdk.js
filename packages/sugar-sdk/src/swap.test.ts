import { parseUnits } from "viem";
import { beforeAll, describe, expect, it } from "vitest";

import { checkHoneyStatus, initDrome } from "@/lib/test-helpers";

import { type Token } from "./primitives";
import { getQuoteForSwap } from "./swap.js";
import { getListedTokens } from "./tokens.js";

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

  // test("quote and swap from WETH to USDC", async ({
  //   config,
  //   supersimConfig,
  //   tokens,
  // }) => {
  //   const amountIn = parseUnits("1", tokens.weth.decimals);
  //   const quote = await getQuoteForSwap(
  //     config,
  //     tokens.weth,
  //     tokens.usdc,
  //     amountIn
  //   );

  //   expect(quote).toBeTruthy();
  //   expect(quote!.fromToken).toEqual(tokens.weth);
  //   expect(quote!.toToken).toEqual(tokens.usdc);
  //   expect(quote!.amount).toBe(amountIn);
  //   expect(quote!.amountOut).toBeGreaterThan(0n);
  //   expect(quote!.path).toBeDefined();
  //   expect(quote!.path.nodes).toBeInstanceOf(Array);
  //   expect(quote!.path.nodes.length).toBeGreaterThan(0);

  //   const r = await swap(supersimConfig, quote!);
  //   expect(r).toBeDefined();
  //   expect(r.startsWith("0x")).toBe(true);
  // });

  test("quote and swap from VELO to USDC", async ({
    config,
    // supersimConfig,
    tokens,
  }) => {
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

    expect(
      quote!.path.nodes
        .map((n) => n.from)
        .includes("0x0a7B751FcDBBAA8BB988B9217ad5Fb5cfe7bf7A0")
    ).toBeFalsy();

    expect(
      quote!.path.nodes
        .map((n) => n.to)
        .includes("0x0a7B751FcDBBAA8BB988B9217ad5Fb5cfe7bf7A0")
    ).toBeFalsy();

    for (const node of quote!.path.nodes) {
      console.log(node);
    }

    // const r = await swap(supersimConfig, quote!, "5"); // 5% slippage tolerance
    // expect(r).toBeDefined();
    // expect(r.startsWith("0x")).toBe(true);

    // const cmd = `uvx --from git+https://github.com/callmephilip/sugar-call-data-for-swap app --chain_id 10 --from_token_address ${quote?.fromToken.address} --to_token_address ${quote?.toToken.address} --account 0x1e7A6B63F98484514610A9F0D5b399d4F7a9b1dA --amount ${parseUnits("100", tokens.velo.decimals)} --slippage 0.01`;
    // console.log("Command to run:", cmd);

    // // Execute the command and capture output
    // const execAsync = promisify(exec);

    // try {
    //   const { stdout, stderr } = await execAsync(cmd);
    //   const output = stdout + stderr;
    //   console.log("Command output:", output);
    // } catch (error) {
    //   console.log("Command error:", error.message);
    // }
  }, 30000);

  // test("quote and swap from ETH to VELO", async ({
  //   config,
  //   supersimConfig,
  //   tokens,
  // }) => {
  //   const amountIn = parseUnits("0.1", tokens.eth.decimals);
  //   const quote = await getQuoteForSwap(
  //     config,
  //     tokens.eth,
  //     tokens.velo,
  //     amountIn
  //   );

  //   expect(quote).toBeTruthy();
  //   expect(quote!.fromToken).toEqual(tokens.eth);
  //   expect(quote!.toToken).toEqual(tokens.velo);
  //   expect(quote!.amount).toBe(amountIn);
  //   expect(quote!.amountOut).toBeGreaterThan(0n);
  //   expect(quote!.path).toBeDefined();
  //   expect(quote!.path.nodes).toBeInstanceOf(Array);
  //   expect(quote!.path.nodes.length).toBeGreaterThan(0);

  //   const r = await swap(supersimConfig, quote!);
  //   expect(r).toBeDefined();
  //   expect(r.startsWith("0x")).toBe(true);
  // });

  // test("quote and swap from VELO to ETH", async ({
  //   config,
  //   supersimConfig,
  //   tokens,
  // }) => {
  //   const amountIn = parseUnits("1000", tokens.velo.decimals);
  //   const quote = await getQuoteForSwap(
  //     config,
  //     tokens.velo,
  //     tokens.eth,
  //     amountIn
  //   );

  //   expect(quote).toBeTruthy();
  //   expect(quote!.fromToken).toEqual(tokens.velo);
  //   expect(quote!.toToken).toEqual(tokens.eth);
  //   expect(quote!.amount).toBe(amountIn);
  //   expect(quote!.amountOut).toBeGreaterThan(0n);
  //   expect(quote!.path).toBeDefined();
  //   expect(quote!.path.nodes).toBeInstanceOf(Array);
  //   expect(quote!.path.nodes.length).toBeGreaterThan(0);

  //   const r = await swap(supersimConfig, quote!);
  //   expect(r).toBeDefined();
  //   expect(r.startsWith("0x")).toBe(true);
  // });

  // test("quote and swap from VELO to WETH", async ({
  //   config,
  //   supersimConfig,
  //   tokens,
  // }) => {
  //   const amountIn = parseUnits("1000", tokens.velo.decimals);
  //   const quote = await getQuoteForSwap(
  //     config,
  //     tokens.velo,
  //     tokens.weth,
  //     amountIn
  //   );

  //   expect(quote).toBeTruthy();
  //   expect(quote!.fromToken).toEqual(tokens.velo);
  //   expect(quote!.toToken).toEqual(tokens.weth);
  //   expect(quote!.amount).toBe(amountIn);
  //   expect(quote!.amountOut).toBeGreaterThan(0n);
  //   expect(quote!.path).toBeDefined();
  //   expect(quote!.path.nodes).toBeInstanceOf(Array);
  //   expect(quote!.path.nodes.length).toBeGreaterThan(0);

  //   const r = await swap(supersimConfig, quote!);
  //   expect(r).toBeDefined();
  //   expect(r.startsWith("0x")).toBe(true);
  // });

  // test("quote and swap from WETH to VELO", async ({
  //   config,
  //   supersimConfig,
  //   tokens,
  // }) => {
  //   const amountIn = parseUnits("1", tokens.weth.decimals);
  //   const quote = await getQuoteForSwap(
  //     config,
  //     tokens.weth,
  //     tokens.velo,
  //     amountIn
  //   );

  //   expect(quote).toBeTruthy();
  //   expect(quote!.fromToken).toEqual(tokens.weth);
  //   expect(quote!.toToken).toEqual(tokens.velo);
  //   expect(quote!.amount).toBe(amountIn);
  //   expect(quote!.amountOut).toBeGreaterThan(0n);
  //   expect(quote!.path).toBeDefined();
  //   expect(quote!.path.nodes).toBeInstanceOf(Array);
  //   expect(quote!.path.nodes.length).toBeGreaterThan(0);

  //   const r = await swap(supersimConfig, quote!);
  //   expect(r).toBeDefined();
  //   expect(r.startsWith("0x")).toBe(true);
  // });
});
