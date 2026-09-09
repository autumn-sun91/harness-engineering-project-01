import { describe, expect, it } from "vitest";

import { merchantSamples } from "./merchant-samples";

describe("merchant evaluation fixture", () => {
  it("contains a draft set of 20 to 30 labeled merchants", () => {
    expect(merchantSamples.length).toBeGreaterThanOrEqual(20);
    expect(merchantSamples.length).toBeLessThanOrEqual(30);
    expect(new Set(merchantSamples.map(({ merchant }) => merchant)).size).toBe(merchantSamples.length);
  });
});
