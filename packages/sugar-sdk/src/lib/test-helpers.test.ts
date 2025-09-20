import { getAccount } from "@wagmi/core";
import { describe, expect, it } from "vitest";

import { init, TEST_ACCOUNT_ADDRESS } from "@/lib/test-helpers";

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
