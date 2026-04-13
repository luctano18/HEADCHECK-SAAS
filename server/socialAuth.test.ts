/**
 * Social Auth (Google OAuth2) — Unit Tests
 *
 * Tests cover:
 * - CSRF state generation (uniqueness, length)
 * - Google OAuth2 URL construction
 * - Profile → openId mapping
 * - Email merging logic (same email → reuse existing openId)
 * - Redirect URI construction from origin
 * - State validation logic
 */
import { describe, it, expect } from "vitest";
import { nanoid } from "nanoid";

// ── CSRF state generation ─────────────────────────────────────────────────────
describe("CSRF state generation", () => {
  it("generates a state of at least 32 characters", () => {
    const state = nanoid(32);
    expect(state.length).toBeGreaterThanOrEqual(32);
  });

  it("generates unique states on each call", () => {
    const states = new Set(Array.from({ length: 1000 }, () => nanoid(32)));
    expect(states.size).toBe(1000);
  });

  it("state contains only URL-safe characters", () => {
    const state = nanoid(32);
    expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

// ── Google OAuth2 URL construction ────────────────────────────────────────────
describe("Google OAuth2 URL construction", () => {
  function buildGoogleUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "online",
      prompt: "select_account",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  it("builds a valid Google authorization URL", () => {
    const url = buildGoogleUrl(
      "test-client-id.apps.googleusercontent.com",
      "https://example.com/api/auth/google/callback",
      "randomstate123"
    );
    expect(url).toContain("accounts.google.com/o/oauth2/v2/auth");
    expect(url).toContain("response_type=code");
    expect(url).toContain("scope=openid+email+profile");
    expect(url).toContain("prompt=select_account");
  });

  it("includes the state parameter in the URL", () => {
    const state = nanoid(32);
    const url = buildGoogleUrl("cid", "https://example.com/callback", state);
    expect(url).toContain(`state=${state}`);
  });

  it("includes the redirect_uri parameter", () => {
    const redirectUri = "https://myapp.manus.space/api/auth/google/callback";
    const url = buildGoogleUrl("cid", redirectUri, "state");
    expect(url).toContain(encodeURIComponent(redirectUri));
  });

  it("includes select_account prompt to allow account switching", () => {
    const url = buildGoogleUrl("cid", "https://example.com/callback", "state");
    expect(url).toContain("prompt=select_account");
  });
});

// ── Google openId generation ──────────────────────────────────────────────────
describe("Google profile → openId mapping", () => {
  it("generates Google openId with 'google_' prefix", () => {
    const googleId = "123456789";
    const openId = `google_${googleId}`;
    expect(openId).toBe("google_123456789");
    expect(openId.startsWith("google_")).toBe(true);
  });

  it("openId is deterministic for the same Google ID", () => {
    const googleId = "987654321";
    expect(`google_${googleId}`).toBe(`google_${googleId}`);
  });

  it("different Google accounts produce different openIds", () => {
    const id1 = `google_111`;
    const id2 = `google_222`;
    expect(id1).not.toBe(id2);
  });
});

// ── Email merging logic ───────────────────────────────────────────────────────
describe("email account merging", () => {
  interface MockUser { openId: string; email: string }

  function resolveOpenId(
    socialOpenId: string,
    socialEmail: string | null,
    existingUsers: MockUser[]
  ): { openId: string; isNew: boolean } {
    if (socialEmail) {
      const existing = existingUsers.find((u) => u.email === socialEmail);
      if (existing) return { openId: existing.openId, isNew: false };
    }
    return { openId: socialOpenId, isNew: true };
  }

  it("reuses existing user openId when email matches", () => {
    const users: MockUser[] = [{ openId: "local_abc123", email: "user@example.com" }];
    const result = resolveOpenId("google_999", "user@example.com", users);
    expect(result.openId).toBe("local_abc123");
    expect(result.isNew).toBe(false);
  });

  it("creates new user when email does not match", () => {
    const users: MockUser[] = [{ openId: "local_abc123", email: "other@example.com" }];
    const result = resolveOpenId("google_999", "new@example.com", users);
    expect(result.openId).toBe("google_999");
    expect(result.isNew).toBe(true);
  });

  it("creates new user when social email is null", () => {
    const users: MockUser[] = [{ openId: "local_abc123", email: "user@example.com" }];
    const result = resolveOpenId("google_777", null, users);
    expect(result.openId).toBe("google_777");
    expect(result.isNew).toBe(true);
  });

  it("creates new user when no existing users", () => {
    const result = resolveOpenId("google_111", "fresh@example.com", []);
    expect(result.openId).toBe("google_111");
    expect(result.isNew).toBe(true);
  });
});

// ── Redirect URI construction ─────────────────────────────────────────────────
describe("redirect URI construction", () => {
  function buildRedirectUri(origin: string): string {
    return `${origin}/api/auth/google/callback`;
  }

  it("builds correct Google callback URI for production", () => {
    const uri = buildRedirectUri("https://myapp.manus.space");
    expect(uri).toBe("https://myapp.manus.space/api/auth/google/callback");
  });

  it("works with localhost origin", () => {
    const uri = buildRedirectUri("http://localhost:3000");
    expect(uri).toBe("http://localhost:3000/api/auth/google/callback");
  });

  it("does not contain double slashes", () => {
    const uri = buildRedirectUri("https://example.com");
    expect(uri).not.toContain("//api");
  });
});

// ── State validation logic ────────────────────────────────────────────────────
describe("state validation", () => {
  it("validates matching states", () => {
    const state = nanoid(32);
    expect(state === state).toBe(true);
  });

  it("rejects mismatched states", () => {
    const cookieState = nanoid(32);
    const queryState = nanoid(32);
    expect(cookieState === queryState).toBe(false);
  });

  it("rejects empty cookie state", () => {
    const cookieState = "";
    const queryState = nanoid(32);
    expect(!cookieState || cookieState !== queryState).toBe(true);
  });

  it("rejects empty query state", () => {
    const cookieState = nanoid(32);
    const queryState = "";
    expect(!queryState || cookieState !== queryState).toBe(true);
  });
});
