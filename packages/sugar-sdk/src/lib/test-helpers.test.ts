import { describe, expect, it } from "vitest";

import { getTransportURL } from "@/lib/test-helpers";

describe("getTransportURL", () => {
  it("should map to local honey server instance when withHoney is true", () => {
    expect(getTransportURL(10, 0, true)).toBe("http://localhost:4444");
    expect(getTransportURL(10, 0, false)).not.toBe("http://localhost:4445");
  });
});
