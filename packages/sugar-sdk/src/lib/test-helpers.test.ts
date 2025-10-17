import { getAccount } from "@wagmi/core";
import { type Address, formatUnits } from "viem";
import { getBalance, readContract } from "viem/actions";
import { beforeAll, describe, expect, it } from "vitest";

import { init, initWithAnvil, TEST_ACCOUNT_ADDRESS } from "@/lib/test-helpers";
import { type Token } from "@/primitives/index.js";
import { getListedTokens } from "@/tokens.js";
import { anvilBase } from "~test/src/anvil.js";
import { account } from "~test/src/constants.js";

describe("init", () => {
  it("works for supersim", async () => {
    const supersimConfig = await init(true);
    const account = getAccount(supersimConfig);
    expect(account.address).toEqual(TEST_ACCOUNT_ADDRESS);
    expect(supersimConfig.chains[0].rpcUrls.default.http).toEqual([
      "http://localhost:4444",
    ]);
  });
  it("works for the real network", async () => {
    const config = await init(false);
    // spot check if this looks like a real network via non public RPC
    expect(
      config.chains[1].rpcUrls.default.http[0].includes("lb.drpc.org")
    ).toBeTruthy();
  });
});

interface InitWithAnvilTestContext {
  tokens: {
    baseAero: Token;
    baseUsdc: Token;
  };
}

const test = it.extend<InitWithAnvilTestContext>({
  // eslint-disable-next-line no-empty-pattern
  tokens: async ({}, use) => {
    const readonlyConfig = await init();
    const allTokens = await getListedTokens({ config: readonlyConfig });

    const findToken = (symbol: string, chainId: number) =>
      allTokens.find(
        (token) =>
          token.symbol.toLowerCase() === symbol.toLowerCase() &&
          token.chainId === chainId
      );

    const baseAero = findToken("aero", 8453);
    const baseUsdc = findToken("usdc", 8453);

    if (!baseAero)
      throw new Error("Could not find BASE AERO token for testing");
    if (!baseUsdc)
      throw new Error("Could not find BASE USDC token for testing");

    await use({ baseAero, baseUsdc });
  },
});

describe("initWithAnvil", () => {
  beforeAll(async () => {
    // Start anvil instance if not already running
    // This is handled by the global setup in most cases
  });

  test("automatically funds account with ETH and additional tokens", async ({
    tokens,
  }) => {
    await initWithAnvil(anvilBase, {
      fundTokens: [
        {
          address: tokens.baseAero.address as Address,
          amount: "1000",
          decimals: tokens.baseAero.decimals,
        },
      ],
    });

    // Get a client to check the balance
    const client = anvilBase.getClient();

    // Check ETH balance
    const ethBalance = await getBalance(client, {
      address: account.address,
    });
    expect(ethBalance).toBeGreaterThan(0n); // Should have ETH funded

    // Check AERO balance
    const aeroBalance = await readContract(client, {
      address: tokens.baseAero.address as `0x${string}`,
      abi: [
        {
          inputs: [{ name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "balanceOf",
      args: [account.address],
    });

    expect(aeroBalance).toBe(BigInt("1000000000000000000000")); // 1000 AERO with 18 decimals
    expect(formatUnits(aeroBalance, tokens.baseAero.decimals)).toBe("1000");
  });

  it("works without funding options (backward compatible)", async () => {
    const config = await initWithAnvil(anvilBase);
    expect(config).toBeDefined();
    expect(config.chains.length).toBeGreaterThan(0);
  });
});
