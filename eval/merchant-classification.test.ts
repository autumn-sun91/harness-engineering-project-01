import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { classifyMerchants } from "../src/services/claude";
import { merchantSamples } from "../scripts/eval/merchant-samples";

describe("merchant classification evaluation", () => {
  it("prints accuracy for the human-reviewed sample set", async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is required for npm run eval");
    }

    const result = await classifyMerchants(merchantSamples.map(({ merchant }) => merchant));
    if (!result.ok) {
      throw new Error(result.message);
    }

    const correct = merchantSamples.reduce(
      (count, sample) => count + (result.data.get(sample.merchant) === sample.expectedCategory ? 1 : 0),
      0,
    );
    const accuracy = (correct / merchantSamples.length) * 100;
    console.log(`merchant classification accuracy: ${accuracy.toFixed(2)}% (${correct}/${merchantSamples.length})`);

    expect(accuracy).toBeGreaterThanOrEqual(0);
    expect(accuracy).toBeLessThanOrEqual(100);
  });
});
