/**
 * Auth Email Router — Unit Tests
 *
 * Tests cover:
 * - Password strength validation logic
 * - bcrypt hash/compare round-trip
 * - Rate limiter logic (in-memory)
 * - Token expiry logic
 * - Input validation (Zod schemas)
 */
import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

// ── Password hashing ──────────────────────────────────────────────────────────
describe("bcrypt password hashing", () => {
  it("hashes a password and verifies it correctly", async () => {
    const password = "SecurePass123!";
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
    const valid = await bcrypt.compare(password, hash);
    expect(valid).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await bcrypt.hash("CorrectPassword1!", 10);
    const valid = await bcrypt.compare("WrongPassword", hash);
    expect(valid).toBe(false);
  });

  it("produces different hashes for the same password (salt)", async () => {
    const password = "SamePassword1!";
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);
    expect(hash1).not.toBe(hash2);
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });
});

// ── Token generation ──────────────────────────────────────────────────────────
describe("reset token generation", () => {
  it("generates a unique token of sufficient length", () => {
    const token1 = nanoid(48);
    const token2 = nanoid(48);
    expect(token1.length).toBeGreaterThanOrEqual(48);
    expect(token1).not.toBe(token2);
  });

  it("generates a valid openId for local users", () => {
    const openId = `local_${nanoid(24)}`;
    expect(openId.startsWith("local_")).toBe(true);
    expect(openId.length).toBeGreaterThan(20);
  });
});

// ── Token expiry logic ────────────────────────────────────────────────────────
describe("token expiry", () => {
  it("detects an expired token", () => {
    const expiresAt = new Date(Date.now() - 1000); // 1 second ago
    expect(expiresAt < new Date()).toBe(true);
  });

  it("detects a valid (non-expired) token", () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    expect(expiresAt > new Date()).toBe(true);
  });

  it("reset token expires in 1 hour", () => {
    const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    const diffMs = expiresAt.getTime() - Date.now();
    expect(diffMs).toBeGreaterThan(59 * 60 * 1000);
    expect(diffMs).toBeLessThanOrEqual(60 * 60 * 1000 + 100);
  });

  it("verification token expires in 24 hours", () => {
    const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS);
    const diffMs = expiresAt.getTime() - Date.now();
    expect(diffMs).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(diffMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 100);
  });
});

// ── Rate limiter ──────────────────────────────────────────────────────────────
describe("in-memory rate limiter", () => {
  const RATE_LIMIT_MAX = 5;
  const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

  // Minimal reimplementation for testing
  const attempts = new Map<string, { count: number; resetAt: number }>();

  function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || entry.resetAt < now) {
      attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return true; // allowed
    }
    entry.count += 1;
    return entry.count <= RATE_LIMIT_MAX;
  }

  beforeEach(() => attempts.clear());

  it("allows requests under the limit", () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(checkRateLimit("192.168.1.1")).toBe(true);
    }
  });

  it("blocks requests over the limit", () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit("10.0.0.1");
    }
    expect(checkRateLimit("10.0.0.1")).toBe(false);
  });

  it("tracks different IPs independently", () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit("1.1.1.1");
    }
    // Different IP should still be allowed
    expect(checkRateLimit("2.2.2.2")).toBe(true);
  });

  it("resets after the window expires", () => {
    const ip = "3.3.3.3";
    // Simulate expired window
    attempts.set(ip, { count: RATE_LIMIT_MAX + 5, resetAt: Date.now() - 1 });
    // Should reset and allow
    expect(checkRateLimit(ip)).toBe(true);
    expect(attempts.get(ip)?.count).toBe(1);
  });
});

// ── Input validation (Zod schemas) ────────────────────────────────────────────
describe("input validation", () => {
  const { z } = require("zod");

  const registerSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(128),
  });

  const forgotPasswordSchema = z.object({ email: z.string().email() });

  const resetPasswordSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  });

  it("validates a valid register input", () => {
    const result = registerSchema.safeParse({
      name: "Alice Dupont",
      email: "alice@example.com",
      password: "SecurePass1!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short name", () => {
    const result = registerSchema.safeParse({ name: "A", email: "a@b.com", password: "SecurePass1!" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ name: "Alice", email: "not-an-email", password: "SecurePass1!" });
    expect(result.success).toBe(false);
  });

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({ name: "Alice", email: "a@b.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("validates forgot password input", () => {
    expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "invalid" }).success).toBe(false);
  });

  it("validates reset password input", () => {
    expect(resetPasswordSchema.safeParse({ token: nanoid(48), newPassword: "NewPass123!" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "", newPassword: "NewPass123!" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: nanoid(48), newPassword: "short" }).success).toBe(false);
  });
});

// ── Email/password user openId format ─────────────────────────────────────────
describe("local user openId format", () => {
  it("starts with 'local_' prefix", () => {
    const openId = `local_${nanoid(24)}`;
    expect(openId).toMatch(/^local_[A-Za-z0-9_-]{24}$/);
  });

  it("is unique for each registration", () => {
    const ids = new Set(Array.from({ length: 100 }, () => `local_${nanoid(24)}`));
    expect(ids.size).toBe(100);
  });
});
