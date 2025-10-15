import { describe, expect, it } from "vitest";

import { chains } from "./chains";

describe("Supported chains", () => {
  it("should be 2", () => {
    expect(chains.length).toBe(2);
  });
  it("should be ordered by ID", () => {
    expect(chains[0].id).toEqual(10);
    expect(chains[1].id).toEqual(8453);
  });
});
