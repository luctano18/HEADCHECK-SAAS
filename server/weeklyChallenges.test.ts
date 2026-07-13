import { describe, it, expect } from "vitest";
import { computeChallengeProgress } from "./db";

describe("computeChallengeProgress", () => {
  it("returns null when the challenge is already completed", () => {
    const result = computeChallengeProgress({ progress: 5, target: 5, completed: true }, 1);
    expect(result).toBeNull();
  });

  it("increments progress without completing when below target", () => {
    const result = computeChallengeProgress({ progress: 1, target: 5, completed: false }, 1);
    expect(result).toEqual({ newProgress: 2, isCompleted: false });
  });

  it("marks completed when progress reaches the target exactly", () => {
    const result = computeChallengeProgress({ progress: 4, target: 5, completed: false }, 1);
    expect(result).toEqual({ newProgress: 5, isCompleted: true });
  });

  it("caps progress at target when increment overshoots", () => {
    const result = computeChallengeProgress({ progress: 4, target: 5, completed: false }, 10);
    expect(result).toEqual({ newProgress: 5, isCompleted: true });
  });

  it("marks completed when target was already met before this call", () => {
    const result = computeChallengeProgress({ progress: 5, target: 5, completed: false }, 1);
    expect(result).toEqual({ newProgress: 5, isCompleted: true });
  });
});
