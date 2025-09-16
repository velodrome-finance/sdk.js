import { Address } from "viem";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommandType, RoutePlanner } from "../lib/router";
import { packRoute } from "./lib";
import { CONTRACT_BALANCE_FOR_V3_SWAPS, setupPlanner } from "./swap";
import { RouteElement, Token } from "./types";

import { getConfig } from "@/lib/test-helpers";

vi.mock("./lib", async () => {
  const router = await vi.importActual("./lib");
  return { ...router, packRoute: vi.fn(() => packedRoute) };
});

interface TestContext {
  sugarConfig: Awaited<ReturnType<typeof getConfig>>;
  DEFAULT_CHAIN_ID: number;
  UNIVERSAL_ROUTER_ADDRESS: Address;
}

const test = it.extend<TestContext>({
  // eslint-disable-next-line no-empty-pattern
  sugarConfig: async ({}, use) => {
    const sugarConfig = await getConfig();
    await use(sugarConfig);
  },
  DEFAULT_CHAIN_ID: async ({ sugarConfig }, use) => {
    await use(sugarConfig.DEFAULT_CHAIN_ID);
  },
  UNIVERSAL_ROUTER_ADDRESS: async ({ sugarConfig, DEFAULT_CHAIN_ID }, use) => {
    const cfg = sugarConfig.chains.find((c) => c.CHAIN.id === DEFAULT_CHAIN_ID)!;
    await use(cfg.UNIVERSAL_ROUTER_ADDRESS);
  },
});
const packedRoute = "0x0000000000000000000000000000000000000007";
const MY_WALLET: string =
  "0x0000000000000000000000000000000000000001" as Address;
const fromToken: Token = {
  address: "0x0000000000000000000000000000000000000001" as Address,
  name: "From token",
  symbol: "FT",
  listed: true,
  decimals: 19,
  balance: 0n,
  price: 0n,
  balanceValue: 0n,
  chainId: 10,
};
const toToken: Token = {
  address: "0x0000000000000000000000000000000000000002" as Address,
  name: "From token",
  symbol: "FT",
  listed: true,
  decimals: 19,
  balance: 0n,
  price: 0n,
  balanceValue: 0n,
  chainId: 10,
};
const nativeToken: Token = Object.assign({}, fromToken, {
  wrappedAddress: "0x0000000000000000000000000000000000000001" as Address,
});

const unstableV2PoolRouteElement = {
  from: fromToken.address,
  to: toToken.address,
  factory: "0x0000000000000000000000000000000000000001" as Address,
  lp: "0x0000000000000000000000000000000000000011" as Address,
  type: -1,
  pool_fee: 0n,
  chainId: 10,
};

const v3PoolRouteElement = {
  from: fromToken.address,
  to: toToken.address,
  factory: "0x0000000000000000000000000000000000000001" as Address,
  lp: "0x0000000000000000000000000000000000000012" as Address,
  type: 100,
  pool_fee: 0n,
  chainId: 10,
};

const buildQuote = (nodes: RouteElement[]) => ({
  amount: 0n,
  amountOut: 0n,
  fromToken,
  toToken,
  priceImpact: 0n,
  path: {
    nodes,
  },
});

describe("Swap setupPlanner", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("works for simple v2 swap", ({ sugarConfig, DEFAULT_CHAIN_ID }) => {
    const routePlanner = new RoutePlanner();
    const quote = buildQuote([unstableV2PoolRouteElement]);

    vi.spyOn(routePlanner, "addCommand");

    setupPlanner({
        config: sugarConfig,
      chainId: DEFAULT_CHAIN_ID,
      account: MY_WALLET as Address,
      quote,
      slippagePct: "1.0",
      routePlanner,
    });

    expect(routePlanner.addCommand).toHaveBeenCalledTimes(1);
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      1,
      CommandType.V2_SWAP_EXACT_IN,
      [MY_WALLET, quote.amount, quote.amountOut, packedRoute, true, false]
    );
  });

  test("works for v2 swaps that require token wrap", ({ sugarConfig, DEFAULT_CHAIN_ID, UNIVERSAL_ROUTER_ADDRESS }) => {
    const routePlanner = new RoutePlanner();
    const quote = Object.assign({}, buildQuote([unstableV2PoolRouteElement]), {
      fromToken: nativeToken,
    });

    vi.spyOn(routePlanner, "addCommand");

    setupPlanner({
        config: sugarConfig,
      chainId: DEFAULT_CHAIN_ID,
      account: MY_WALLET as Address,
      quote,
      slippagePct: "1.0",
      routePlanner,
    });

    expect(routePlanner.addCommand).toHaveBeenCalledTimes(2);
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      1,
      CommandType.WRAP_ETH,
      [UNIVERSAL_ROUTER_ADDRESS, quote.amount]
    );
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      2,
      CommandType.V2_SWAP_EXACT_IN,
      [MY_WALLET, quote.amount, quote.amountOut, packedRoute, false, false]
    );
  });

  test("works for v2 swaps that require token unwrap", ({ sugarConfig, DEFAULT_CHAIN_ID, UNIVERSAL_ROUTER_ADDRESS }) => {
    const routePlanner = new RoutePlanner();
    const quote = Object.assign({}, buildQuote([unstableV2PoolRouteElement]), {
      toToken: nativeToken,
    });

    vi.spyOn(routePlanner, "addCommand");

    setupPlanner({
      chainId: DEFAULT_CHAIN_ID,
      account: MY_WALLET as Address,
      quote,
      slippagePct: "1.0",
      routePlanner,
      config: sugarConfig,
    });

    expect(routePlanner.addCommand).toHaveBeenCalledTimes(2);
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      1,
      CommandType.V2_SWAP_EXACT_IN,
      [
        UNIVERSAL_ROUTER_ADDRESS,
        quote.amount,
        quote.amountOut,
        packedRoute,
        true,
        false,
      ]
    );
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      2,
      CommandType.UNWRAP_WETH,
      [MY_WALLET, quote.amount]
    );
  });

  test("works for simple v3 swap", ({ sugarConfig, DEFAULT_CHAIN_ID }) => {
    const routePlanner = new RoutePlanner();
    const quote = buildQuote([v3PoolRouteElement]);

    vi.spyOn(routePlanner, "addCommand");

    setupPlanner({
      chainId: DEFAULT_CHAIN_ID,
      account: MY_WALLET as Address,
      quote,
      slippagePct: "1.0",
      routePlanner,
      config: sugarConfig,
    });

    expect(packRoute).toHaveBeenCalledTimes(1);
    expect(packRoute).toHaveBeenCalledWith(sugarConfig, [v3PoolRouteElement]);
    expect(routePlanner.addCommand).toHaveBeenCalledTimes(1);
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      1,
      CommandType.V3_SWAP_EXACT_IN,
      [MY_WALLET, quote.amount, quote.amountOut, packedRoute, true, false]
    );
  });

  test("works for simple hybrid swaps: v2 + v2 + v3", ({ sugarConfig, DEFAULT_CHAIN_ID, UNIVERSAL_ROUTER_ADDRESS }) => {
    const routePlanner = new RoutePlanner();
    const quote = buildQuote([
      // v2 pool + v3 pool
      unstableV2PoolRouteElement,
      unstableV2PoolRouteElement,
      v3PoolRouteElement,
    ]);

    vi.spyOn(routePlanner, "addCommand");

    setupPlanner({
      chainId: DEFAULT_CHAIN_ID,
      account: MY_WALLET as Address,
      quote,
      slippagePct: "1.0",
      routePlanner,
        config: sugarConfig,
    });

    expect(routePlanner.addCommand).toHaveBeenCalledTimes(2);
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      1,
      CommandType.V2_SWAP_EXACT_IN,
      [
        UNIVERSAL_ROUTER_ADDRESS, // <- first v2 batch goes into the router
        quote.amount,
        0n, // <- no min amount out
        packedRoute,
        true,
        false,
      ]
    );

    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      2,
      CommandType.V3_SWAP_EXACT_IN,
      [
        MY_WALLET,
        CONTRACT_BALANCE_FOR_V3_SWAPS,
        quote.amountOut,
        packedRoute,
        false,
        false,
      ]
    );
  });

  test("works for a more advanced  hybrid swaps: v2 + v3 + v2", ({ sugarConfig, DEFAULT_CHAIN_ID, UNIVERSAL_ROUTER_ADDRESS }) => {
    const routePlanner = new RoutePlanner();
    const quote = buildQuote([
      // v2 pool + v3 pool + v2
      unstableV2PoolRouteElement,
      v3PoolRouteElement,
      unstableV2PoolRouteElement,
    ]);

    vi.spyOn(routePlanner, "addCommand");

    setupPlanner({
      chainId: DEFAULT_CHAIN_ID,
      account: MY_WALLET as Address,
      quote,
      slippagePct: "1.0",
      routePlanner,
      config: sugarConfig,
    });

    expect(routePlanner.addCommand).toHaveBeenCalledTimes(3);
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      1,
      CommandType.V2_SWAP_EXACT_IN,
      [
        UNIVERSAL_ROUTER_ADDRESS, // <- first v2 batch goes into the router
        quote.amount,
        0n, // <- no min amount out
        packedRoute,
        true,
        false,
      ]
    );
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      2,
      CommandType.V3_SWAP_EXACT_IN,
      [
        unstableV2PoolRouteElement.lp,
        CONTRACT_BALANCE_FOR_V3_SWAPS,
        0n,
        packedRoute,
        false,
        false,
      ]
    );
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      3,
      CommandType.V2_SWAP_EXACT_IN,
      [MY_WALLET, 0n, quote.amountOut, packedRoute, false, false]
    );
  });

  test("works for a super convoluted made up hybrid swap: v3 + v2 + v3 + v3 + v2", ({ sugarConfig, DEFAULT_CHAIN_ID, UNIVERSAL_ROUTER_ADDRESS }) => {
    const routePlanner = new RoutePlanner();
    const quote = buildQuote([
      // v3 + v2 + v3 + v3 + v2
      v3PoolRouteElement, // lp: "0x0000000000000000000000000000000000000012"
      unstableV2PoolRouteElement, // lp: "0x0000000000000000000000000000000000000011"
      Object.assign({}, v3PoolRouteElement, {
        lp: "0x0000000000000000000000000000000000000013" as Address,
      }),
      Object.assign({}, v3PoolRouteElement, {
        lp: "0x0000000000000000000000000000000000000014" as Address,
      }),
      Object.assign({}, unstableV2PoolRouteElement, {
        lp: "0x0000000000000000000000000000000000000015" as Address,
      }),
    ]);

    vi.spyOn(routePlanner, "addCommand");

    setupPlanner({
      chainId: DEFAULT_CHAIN_ID,
      account: MY_WALLET as Address,
      quote,
      slippagePct: "1.0",
      routePlanner,
      config: sugarConfig,
    });

    expect(routePlanner.addCommand).toHaveBeenCalledTimes(4);
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      1,
      CommandType.V3_SWAP_EXACT_IN,
      [
        unstableV2PoolRouteElement.lp, // <- first v3 batch goes into the next v2 batch pool
        quote.amount,
        0n, // <- no min amount out
        packedRoute,
        true,
        false,
      ]
    );
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      2,
      CommandType.V2_SWAP_EXACT_IN,
      [UNIVERSAL_ROUTER_ADDRESS, 0n, 0n, packedRoute, false, false]
    );
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      3,
      CommandType.V3_SWAP_EXACT_IN,
      [
        "0x0000000000000000000000000000000000000015",
        CONTRACT_BALANCE_FOR_V3_SWAPS,
        0n,
        packedRoute,
        false,
        false,
      ]
    );
    expect(routePlanner.addCommand).toHaveBeenNthCalledWith(
      4,
      CommandType.V2_SWAP_EXACT_IN,
      [MY_WALLET, 0n, 0n, packedRoute, false, false]
    );
  });
});
