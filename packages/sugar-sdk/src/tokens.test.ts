import { describe, expect, it } from "vitest";

import { initDrome } from "./lib/test-helpers.js";
import { getListedTokens } from "./tokens.js";

describe("Test fetching tokens", () => {
  it("should be able to fetch", async () => {
    const tokens = await getListedTokens(await initDrome());
    expect(tokens).toBeDefined();
    expect(tokens.length).toBeGreaterThan(200);
  });
});
