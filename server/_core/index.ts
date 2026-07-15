import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// ============================================
// ENVIRONMENT VALIDATION
// ============================================
const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "RESEND_API_KEY",
  "OPENAI_API_KEY",
] as const;

const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((key) => console.error(`   - ${key}`));
  console.error("\nPlease copy .env.example to .env and fill in the values.");
  process.exit(1);
}

console.log("✅ All required environment variables are set");
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerSocialAuthRoutes } from "./socialAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sendWeeklyReflections } from "../weeklyReflection";
import { sendCrisisFollowUps } from "../crisisFollowUp";
import stripe from "../stripe";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust exactly one upstream hop (the Caddy reverse proxy in front of this
  // container) so req.ip / X-Forwarded-For / X-Forwarded-Proto are read from
  // Caddy's headers rather than rejected as spoofable.
  app.set("trust proxy", 1);

  // ─── Security Middleware ───────────────────────────────────────────────────
  // Secure HTTP headers. img-src is widened to any https: source (matching
  // the default's own font-src/style-src pattern) since the app references
  // external image hosts — the branding logo on a CDN, Google OAuth avatar
  // URLs — not just same-origin/data: URIs.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "img-src": ["'self'", "data:", "https:"],
        },
      },
    })
  );

  // CORS configuration
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : ["http://localhost:3000", "https://headcheck.app"];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );

  // Global rate limiting (100 requests per 15 minutes per IP)
  const globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalRateLimit);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ─── Health Check Endpoint ─────────────────────────────────────────────────
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  // ─── Stripe Webhook ────────────────────────────────────────────────────────
  app.post("/api/webhook/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[Stripe] Webhook secret not configured");
      return res.status(400).send("Webhook secret not configured");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("[Stripe] Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      const { handleWebhookEvent } = await import("../stripe");
      await handleWebhookEvent(event);
      res.json({ received: true });
    } catch (err) {
      console.error("[Stripe] Webhook handler error:", err);
      res.status(500).send("Webhook handler failed");
    }
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Social auth routes (Google + GitHub)
  registerSocialAuthRoutes(app);
  // ─── Cron Routes ─────────────────────────────────────────────────────────────
  // GET /api/cron/weekly-reflection — triggered every Monday at 9:00 AM UTC
  app.get("/api/cron/weekly-reflection", async (req: import("express").Request, res: import("express").Response) => {
    const secret = req.headers["x-cron-secret"] as string | undefined;
    const appUrl = req.headers.origin as string || `${req.protocol}://${req.get("host")}`;
    try {
      const result = await sendWeeklyReflections(appUrl, secret);
      res.json({ ok: true, ...result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "Unauthorized") {
        res.status(401).json({ ok: false, error: "Unauthorized" });
      } else {
        console.error("[WeeklyReflection] Error:", err);
        res.status(500).json({ ok: false, error: message });
      }
    }
  });

  // GET /api/cron/crisis-follow-up — polled hourly
  app.get("/api/cron/crisis-follow-up", async (req: import("express").Request, res: import("express").Response) => {
    const secret = req.headers["x-cron-secret"] as string | undefined;
    const appUrl = req.headers.origin as string || `${req.protocol}://${req.get("host")}`;
    try {
      const result = await sendCrisisFollowUps(appUrl, secret);
      res.json({ ok: true, ...result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "Unauthorized") {
        res.status(401).json({ ok: false, error: "Unauthorized" });
      } else {
        console.error("[CrisisFollowUp] Error:", err);
        res.status(500).json({ ok: false, error: message });
      }
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
