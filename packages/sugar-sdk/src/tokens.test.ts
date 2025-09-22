import { describe, expect, it } from "vitest";

import { init } from "./lib/test-helpers.js";
import { getListedTokens } from "./tokens.js";

describe("Test fetching tokens", () => {
  it("should be able to fetch", async () => {
    const tokens = await getListedTokens({ config: await init() });
    expect(tokens).toBeDefined();
    expect(tokens.length).toBeGreaterThan(200);
  });
});
