import { getAccount } from "@wagmi/core";
import { describe, expect, it } from "vitest";

import {
  getTransportURL,
  initDrome,
  TEST_ACCOUNT_ADDRESS,
} from "@/lib/test-helpers";

describe("getTransportURL", () => {
  it("should map to local honey server instance when withHoney is true", () => {
    expect(getTransportURL(10, 0, true)).toBe("http://localhost:4443");
    expect(getTransportURL(10, 0, false)).not.toBe("http://localhost:4445");
  });
});

describe("initDrome", () => {
  it("works for supersim", async () => {
    const supersimConfig = await initDrome(true);
    const account = getAccount(supersimConfig);
    expect(account.address).toEqual(TEST_ACCOUNT_ADDRESS);
    expect(supersimConfig.chains[1].rpcUrls.default.http).toEqual([
      "http://localhost:4444",
    ]);
  });
  it("works for the real network", async () => {
    const config = await initDrome(false);
    // spot check if this looks like a real network via non public RPC
    expect(
      config.chains[1].rpcUrls.default.http[0].includes("lb.drpc.org")
    ).toBeTruthy();
  });
});
