import { describe, expect, it } from "vitest";

import { chains } from "./chains";

describe("Supported chains", () => {
  it("should include all supported chains", () => {
    expect(chains.length).toBe(12);
  });
  it("should be ordered by ID", () => {
    const expectedOrder = [
      10, // Optimism
      130, // Unichain
      252, // Fraxtal
      1135, // Lisk
      1750, // Metal L2
      1868, // Soneium
      1923, // Swellchain
      5330, // Superseed
      8453, // Base
      34443, // Mode
      42220, // Celo
      57073, // Ink
    ];

    expect(chains.map((chain) => chain.id)).toEqual(expectedOrder);
  });
});
