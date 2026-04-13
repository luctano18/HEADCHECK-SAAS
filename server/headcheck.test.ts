import { describe, expect, it } from "vitest";
import { detectCrisis, detectViolence } from "./routers";

describe("detectCrisis", () => {
  it("detects critical crisis keywords", () => {
    const result = detectCrisis("I want to kill myself", 5);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("critical");
  });

  it("detects high severity from keywords", () => {
    const result = detectCrisis("I feel completely hopeless and worthless", 6);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("high");
  });

  it("detects high severity from intensity alone (>=9)", () => {
    const result = detectCrisis("I am just very sad today", 9);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("high");
  });

  it("detects moderate severity with moderate keywords + high intensity", () => {
    const result = detectCrisis("I feel overwhelmed and can't cope anymore", 7);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("moderate");
  });

  it("does not detect crisis for normal journal entry", () => {
    const result = detectCrisis("Today was a bit stressful but I managed well", 4);
    expect(result.detected).toBe(false);
    expect(result.severity).toBeNull();
  });

  it("does not detect crisis for empty text with low intensity", () => {
    const result = detectCrisis("", 3);
    expect(result.detected).toBe(false);
    expect(result.severity).toBeNull();
  });

  it("is case-insensitive for keyword detection", () => {
    const result = detectCrisis("I WANT TO END MY LIFE", 5);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("critical");
  });

  it("detects critical over high when both present", () => {
    const result = detectCrisis("I feel hopeless and want to kill myself", 8);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("critical");
  });
});

describe("auth.logout", () => {
  it("clears session cookie on logout", async () => {
    const { appRouter } = await import("./routers");
    const { COOKIE_NAME } = await import("../shared/const");
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];

    const ctx = {
      user: { id: 1, openId: "test-user", email: "test@example.com", name: "Test User", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), institutionId: null, groupId: null, role_hc: "student" as const, onboardingCompleted: true },
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: (name: string, options: Record<string, unknown>) => clearedCookies.push({ name, options }) } as any,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("detectViolence", () => {
  it("detects critical violence toward others", () => {
    const result = detectViolence("I want to kill them all", 5);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("critical");
    expect(result.type).toBe("violence_toward_others");
  });

  it("detects high violence toward others", () => {
    const result = detectViolence("I want to fight and hurt someone", 6);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("high");
    expect(result.type).toBe("violence_toward_others");
  });

  it("detects moderate violence with high intensity", () => {
    const result = detectViolence("I have violent thoughts and can't control my anger", 8);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("moderate");
    expect(result.type).toBe("violence_toward_others");
  });

  it("does NOT detect moderate violence with low intensity", () => {
    const result = detectViolence("I have violent thoughts sometimes", 4);
    expect(result.detected).toBe(false);
    expect(result.severity).toBeNull();
    expect(result.type).toBeNull();
  });

  it("detects self-harm as type self_harm", () => {
    const result = detectViolence("I want to end my life and kill myself", 5);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("critical");
    expect(result.type).toBe("self_harm");
  });

  it("prioritizes violence_toward_others over self_harm when both present", () => {
    const result = detectViolence("I want to kill them and hurt myself", 5);
    expect(result.detected).toBe(true);
    expect(result.type).toBe("violence_toward_others");
  });

  it("detects French violence keywords", () => {
    const result = detectViolence("Je veux les tuer tous", 5);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("critical");
    expect(result.type).toBe("violence_toward_others");
  });

  it("does not detect violence for normal text", () => {
    const result = detectViolence("I had a stressful day at work", 4);
    expect(result.detected).toBe(false);
    expect(result.severity).toBeNull();
    expect(result.type).toBeNull();
  });

  it("is case-insensitive for violence keywords", () => {
    const result = detectViolence("I WANT TO KILL HIM", 5);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("critical");
    expect(result.type).toBe("violence_toward_others");
  });
});
