/**
 * Email/Password Authentication Router
 * Provides: register, loginEmail, forgotPassword, resetPassword, changePassword, verifyEmail
 *
 * Session strategy: reuses the existing JWT cookie (COOKIE_NAME) signed with JWT_SECRET.
 * The JWT payload is { openId, appId, name } — same as OAuth flow — so sdk.authenticateRequest
 * works transparently for both auth methods.
 */
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import {
  createPasswordResetToken,
  createUserWithCredential,
  getCredentialByUserId,
  getPasswordResetToken,
  getUserByEmail,
  markPasswordResetTokenUsed,
  updatePasswordHash,
  verifyEmailToken,
} from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { ENV } from "../_core/env";
import { invokeLLM } from "../_core/llm";
import { sdk } from "../_core/sdk";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Rate limiting (in-memory, per IP, resets on server restart) ───────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 min

function checkRateLimit(ip: string) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many attempts. Please try again in 15 minutes.",
    });
  }
}

// ── Helper: issue a session cookie ────────────────────────────────────────────
async function issueSession(
  res: import("express").Response,
  req: import("express").Request,
  openId: string,
  name: string
) {
  const token = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
  return token;
}

// ── Helper: send email via LLM notification (best-effort) ────────────────────
async function sendAuthEmail(to: string, subject: string, body: string) {
  try {
    // Use Manus built-in notification as email delivery (owner notification channel)
    // In production, replace with a real SMTP/SendGrid integration
    await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an email delivery system. Log the following email that should be sent:\nTO: ${to}\nSUBJECT: ${subject}\nBODY:\n${body}`,
        },
        { role: "user", content: "Confirm email logged." },
      ],
    });
  } catch {
    // Non-blocking — email delivery failure should not block auth
  }
}

// ── Router ────────────────────────────────────────────────────────────────────
export const authEmailRouter = router({
  /**
   * Register a new account with email + password.
   * Creates user + credential rows, issues a session cookie, sends verification email.
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters").max(100),
        email: z.string().email("Invalid email address"),
        password: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .max(128),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ip = ctx.req.ip ?? "unknown";
      checkRateLimit(ip);

      // Check if email already taken
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
      const openId = `local_${nanoid(24)}`;
      const verificationToken = nanoid(48);
      const verificationExpiry = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS);

      const user = await createUserWithCredential({
        openId,
        name: input.name,
        email: input.email,
        passwordHash,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      });

      // Issue session immediately (email verification is async / optional)
      await issueSession(ctx.res as import("express").Response, ctx.req as import("express").Request, openId, input.name);

      // Send verification email (best-effort, non-blocking)
      const verifyUrl = `${ctx.req.headers.origin ?? ""}/verify-email?token=${verificationToken}`;
      sendAuthEmail(
        input.email,
        "Verify your HeadCheck email",
        `Hi ${input.name},\n\nWelcome to HeadCheck! Please verify your email:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you did not create this account, you can safely ignore this email.`
      );

      return {
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
      };
    }),

  /**
   * Sign in with email + password.
   * Issues a session cookie on success.
   */
  loginEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ip = ctx.req.ip ?? "unknown";
      checkRateLimit(ip);

      const user = await getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      const cred = await getCredentialByUserId(user.id);
      if (!cred) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            "This account uses a different sign-in method. Please use the OAuth button.",
        });
      }

      const valid = await bcrypt.compare(input.password, cred.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      await issueSession(
        ctx.res as import("express").Response,
        ctx.req as import("express").Request,
        user.openId,
        user.name ?? input.email
      );

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: cred.emailVerified,
        },
      };
    }),

  /**
   * Request a password reset email.
   * Always returns success to prevent email enumeration.
   */
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const ip = ctx.req.ip ?? "unknown";
      checkRateLimit(ip);

      const user = await getUserByEmail(input.email);
      if (user) {
        const cred = await getCredentialByUserId(user.id);
        if (cred) {
          const token = nanoid(48);
          const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
          await createPasswordResetToken(user.id, token, expiresAt);
          const resetUrl = `${ctx.req.headers.origin ?? ""}/reset-password?token=${token}`;
          sendAuthEmail(
            input.email,
            "Reset your HeadCheck password",
            `Hi ${user.name ?? "there"},\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour and can only be used once.\n\nIf you did not request a password reset, you can safely ignore this email.`
          );
        }
      }

      // Always return success to prevent email enumeration
      return { success: true };
    }),

  /**
   * Reset password using a valid reset token.
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        newPassword: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .max(128),
      })
    )
    .mutation(async ({ input }) => {
      const record = await getPasswordResetToken(input.token);
      if (!record) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset link.",
        });
      }
      if (record.usedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This reset link has already been used.",
        });
      }
      if (record.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This reset link has expired. Please request a new one.",
        });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
      await updatePasswordHash(record.userId, passwordHash);
      await markPasswordResetTokenUsed(input.token);

      return { success: true };
    }),

  /**
   * Change password for authenticated users (requires current password).
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .max(128),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cred = await getCredentialByUserId(ctx.user.id);
      if (!cred) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No password set for this account.",
        });
      }

      const valid = await bcrypt.compare(input.currentPassword, cred.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect.",
        });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
      await updatePasswordHash(ctx.user.id, passwordHash);

      return { success: true };
    }),

  /**
   * Verify email address using the token sent during registration.
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const verified = await verifyEmailToken(input.token);
      if (!verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification link.",
        });
      }
      return { success: true };
    }),

  /**
   * Check if an email is already registered (for real-time form validation).
   */
  checkEmailAvailable: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      return { available: !user };
    }),

  /**
   * Get email verification status for the currently authenticated user.
   */
  getEmailVerifiedStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const cred = await getCredentialByUserId(ctx.user.id);
      return { emailVerified: cred?.emailVerified ?? null };
    }),
});

// Export individual procedures for merging into the main auth router
// (the router object is used for type inference only)
