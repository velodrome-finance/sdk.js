import { describe, expect, it } from "vitest";

import { getTransportURL } from "./utils.js";

describe("getTransportURL", () => {
  it("should map to local honey server instance when withHoney is true", () => {
    expect(getTransportURL(10, 0, true)).toBe("http://localhost:4443");
    expect(getTransportURL(10, 0, false)).not.toBe("http://localhost:4445");
  });
});
