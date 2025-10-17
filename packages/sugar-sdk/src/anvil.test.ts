import { getBalance } from "@wagmi/core";
import { describe, expect, it } from "vitest";

import { anvilBase } from "~test/src/anvil.js";
import { accounts } from "~test/src/constants.js";

import { initWithAnvil } from "./lib/test-helpers.js";

describe("initWithAnvil", () => {
  it("produces a working config for single anvil instance", async () => {
    // Create config using initWithAnvil helper
    const config = await initWithAnvil(anvilBase);

    // Verify config was created
    expect(config).toBeDefined();
    expect(config.sugarConfig).toBeDefined();

    // Verify the chain is configured correctly
    expect(config.chains).toHaveLength(1);
    expect(config.chains[0].id).toBe(8453); // Base chain ID

    // Test connectivity by reading account balance
    const balance = await getBalance(config, {
      address: accounts[0].address,
      chainId: 8453,
    });

    // Anvil accounts should have a balance
    expect(balance.value).toBeGreaterThan(0n);
    expect(balance.value).toBe(10000000000000000000000n); // 10000 ETH
    expect(balance.symbol).toBe("ETH");
    expect(balance.decimals).toBe(18);
  });

  it("config can be used for basic wagmi operations", async () => {
    const config = await initWithAnvil(anvilBase);

    // Test reading multiple account balances
    const balances = await Promise.all(
      accounts.slice(0, 3).map((account: (typeof accounts)[number]) =>
        getBalance(config, {
          address: account.address,
          chainId: 8453,
        })
      )
    );

    // All test accounts should have balances
    balances.forEach((balance: Awaited<ReturnType<typeof getBalance>>) => {
      expect(balance.value).toBeGreaterThan(0n);
      expect(balance.symbol).toBe("ETH");
    });
  });

  it("supports chainUrls option for manual URL mapping", async () => {
    const config = await initWithAnvil({
      8453: anvilBase,
    });

    expect(config.chains).toHaveLength(1);
    expect(config.chains[0].id).toBe(8453);

    // Verify connectivity
    const balance = await getBalance(config, {
      address: accounts[0].address,
      chainId: 8453,
    });

    expect(balance.value).toBe(10000000000000000000000n);
  });
});
