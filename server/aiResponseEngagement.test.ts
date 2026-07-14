import { describe, it, expect } from "vitest";
import { computeCombinedEngagementScore } from "./db";

describe("computeCombinedEngagementScore", () => {
  it("scores 'yes' feedback as 5 plus the behavior score", () => {
    expect(computeCombinedEngagementScore("yes", 2)).toBe(7);
  });

  it("scores 'helpful' feedback the same as 'yes'", () => {
    expect(computeCombinedEngagementScore("helpful", 0)).toBe(5);
  });

  it("scores 'somewhat' feedback as 3 plus the behavior score", () => {
    expect(computeCombinedEngagementScore("somewhat", 1)).toBe(4);
  });

  it("scores 'not_yet' feedback as 1 plus the behavior score", () => {
    expect(computeCombinedEngagementScore("not_yet", -2)).toBe(-1);
  });

  it("scores 'not_helpful' feedback the same as 'not_yet'", () => {
    expect(computeCombinedEngagementScore("not_helpful", 2)).toBe(3);
  });

  it("treats no feedback (null) as contributing 0", () => {
    expect(computeCombinedEngagementScore(null, -2)).toBe(-2);
    expect(computeCombinedEngagementScore(null, 2)).toBe(2);
  });

  it("treats an unrecognized rating string as contributing 0", () => {
    expect(computeCombinedEngagementScore("unexpected_value", 1)).toBe(1);
  });
});
