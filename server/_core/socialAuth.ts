/**
 * Social Authentication Routes — Google OAuth2 only
 *
 * Flow (Authorization Code):
 *  1. GET /api/auth/google  → redirect to Google authorization URL
 *  2. Google redirects to /api/auth/google/callback?code=…&state=…
 *  3. Server exchanges code for access token, fetches profile
 *  4. Upsert user in DB (merge if same email exists), issue JWT session cookie
 *  5. Redirect to /dashboard (or /onboarding for new users)
 *
 * CSRF protection: a random `state` value is stored in a short-lived cookie
 * and verified on callback before any token exchange.
 */
import type { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

// ── Env helpers ───────────────────────────────────────────────────────────────
function env(key: string): string {
  return process.env[key] ?? "";
}

// ── State cookie (CSRF protection) ───────────────────────────────────────────
const STATE_COOKIE = "social_oauth_state";
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function setStateCookie(res: Response, state: string, req: Request) {
  const opts = getSessionCookieOptions(req);
  res.cookie(STATE_COOKIE, state, {
    ...opts,
    maxAge: STATE_EXPIRY_MS,
    httpOnly: true,
  });
}

function validateState(req: Request, res: Response): boolean {
  const rawCookies = parseCookieHeader(req.headers.cookie ?? "");
  const cookieState = rawCookies[STATE_COOKIE];
  const queryState = req.query["state"];
  res.clearCookie(STATE_COOKIE);
  if (!cookieState || !queryState || cookieState !== queryState) {
    return false;
  }
  return true;
}

// ── Generic error redirect ────────────────────────────────────────────────────
function redirectWithError(res: Response, message: string) {
  const encoded = encodeURIComponent(message);
  res.redirect(302, `/login?error=${encoded}`);
}

// ── Google OAuth2 ─────────────────────────────────────────────────────────────
async function exchangeGoogleCode(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    code,
    client_id: env("GOOGLE_CLIENT_ID"),
    client_secret: env("GOOGLE_CLIENT_SECRET"),
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }
  return res.json() as Promise<{ access_token: string; id_token?: string }>;
}

async function fetchGoogleProfile(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Google profile");
  return res.json() as Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified_email?: boolean;
  }>;
}

// ── Session issuer ────────────────────────────────────────────────────────────
async function issueSessionAndRedirect(
  req: Request,
  res: Response,
  params: {
    openId: string;
    name: string;
    email: string | null;
    loginMethod: string;
    isNew: boolean;
  }
) {
  await db.upsertUser({
    openId: params.openId,
    name: params.name,
    email: params.email,
    loginMethod: params.loginMethod,
    lastSignedIn: new Date(),
  });

  const sessionToken = await sdk.createSessionToken(params.openId, {
    name: params.name,
    expiresInMs: ONE_YEAR_MS,
  });

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

  // New users go to onboarding, returning users go to dashboard
  res.redirect(302, params.isNew ? "/onboarding?social=1" : "/dashboard?social=1");
}

// ── Route registration ────────────────────────────────────────────────────────
export function registerSocialAuthRoutes(app: Express) {
  // ── Google: initiate ────────────────────────────────────────────────────────
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const clientId = env("GOOGLE_CLIENT_ID");
    if (!clientId) {
      return redirectWithError(res, "Google sign-in is not configured.");
    }
    const state = nanoid(32);
    setStateCookie(res, state, req);

    const origin = req.headers["x-forwarded-host"]
      ? `${req.protocol}://${req.headers["x-forwarded-host"]}`
      : `${req.protocol}://${req.headers.host}`;

    const redirectUri = `${origin}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "online",
      prompt: "select_account",
    });
    res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  // ── Google: callback ────────────────────────────────────────────────────────
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    if (!validateState(req, res)) {
      return redirectWithError(res, "Invalid OAuth state. Please try again.");
    }
    const code = req.query["code"] as string | undefined;
    if (!code) return redirectWithError(res, "No authorization code received from Google.");

    try {
      const origin = req.headers["x-forwarded-host"]
        ? `${req.protocol}://${req.headers["x-forwarded-host"]}`
        : `${req.protocol}://${req.headers.host}`;
      const redirectUri = `${origin}/api/auth/google/callback`;

      const tokens = await exchangeGoogleCode(code, redirectUri);
      const profile = await fetchGoogleProfile(tokens.access_token);

      const openId = `google_${profile.id}`;

      // Check if user already exists (by email) to determine isNew
      const existing = profile.email ? await db.getUserByEmail(profile.email) : null;
      const isNew = !existing;

      await issueSessionAndRedirect(req, res, {
        openId: existing?.openId ?? openId,
        name: profile.name ?? profile.email ?? "Google User",
        email: profile.email ?? null,
        loginMethod: "google",
        isNew,
      });
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      redirectWithError(res, "Google sign-in failed. Please try again.");
    }
  });
}
