# VPS Deployment (Docker Compose + Caddy)

**Date:** 2026-07-14
**Status:** Approved

## Context

The repo already has a `Dockerfile` and `docker-compose.yml` (app + MySQL), so the
deployment target is a Proxmox VM (functionally a VPS) running Docker Compose,
with a subdomain already available. This spec closes the gaps between the
existing compose file and a safe, working production deployment: no TLS
termination, a publicly exposed database port, missing required environment
variables, and no path for running database migrations or the two existing
cron jobs (`/api/cron/weekly-reflection`, `/api/cron/crisis-follow-up`).

## Scope

In scope:
- A `caddy` reverse-proxy service added to `docker-compose.yml`, terminating
  TLS automatically (Let's Encrypt) for the subdomain and forwarding to the
  app service over the internal Docker network.
- Remove the public port mappings for the `app` and `db` services — only
  Caddy publishes ports 80/443 to the host; the app and database are reachable
  only over the internal Compose network.
- Add the missing required/production environment variables to
  `docker-compose.yml`'s `app` service (`CRON_SECRET`, `CORS_ORIGIN`,
  `GOOGLE_REDIRECT_BASE`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRO_PRICE_ID`, `STRIPE_INSTITUTION_PRICE_ID`, `RESEND_FROM_EMAIL`).
- Update `Dockerfile`'s production stage to include the `drizzle/` folder
  (schema + migrations), and change its start command to run
  `drizzle-kit migrate` before starting the server, so every deploy applies
  any pending migrations automatically.
- A deploy runbook (`docs/deploy/vps-runbook.md`) documenting: VM
  prerequisites, installing Docker, the `.env` file to create on the VM,
  first deploy, and the two `crontab` lines to add on the VM host so the
  cron endpoints actually get called (hourly for crisis-follow-up, weekly
  Monday 9am UTC for weekly-reflection, matching their existing doc
  comments) — calling the public HTTPS endpoint with the `x-cron-secret`
  header, no extra container needed for this.

Out of scope: CI/CD (automated deploy on push), log aggregation/monitoring,
backups, multi-VM/HA setup, S3/file-upload storage configuration (the repo
already depends on `@aws-sdk/client-s3` but wiring an actual bucket is a
separate concern from getting the app running).

## Design

### 1. `docker-compose.yml`

Three services: `app`, `db`, `caddy`. `app` and `db` no longer publish ports
to the host — only `caddy` does (80/443). `app`'s environment gets the full
set of variables the running server actually reads from `process.env`
(cross-checked against `server/`), each sourced from a `.env` file on the VM
(not committed). `caddy` mounts a `Caddyfile` and two named volumes for
certificate/config persistence, and depends on `app` being healthy.

### 2. `Dockerfile`

The production stage currently copies only `dist/`, `node_modules/`, and
`package.json` — it's missing `drizzle/` (schema + migration SQL files),
which `drizzle-kit migrate` needs at runtime. Add `COPY --from=builder
/app/drizzle ./drizzle` and `COPY --from=builder /app/drizzle.config.ts
./drizzle.config.ts`. Change `CMD` to run migrations first:
`CMD ["sh", "-c", "npx drizzle-kit migrate && node dist/index.js"]`. This is
safe to run on every container start — Drizzle tracks applied migrations in
its own table and no-ops if there's nothing pending.

### 3. `Caddyfile` (new file, repo root)

```
{$DOMAIN} {
	reverse_proxy app:3000
}
```

`DOMAIN` is supplied via the VM's `.env` file and passed through to the
`caddy` service in `docker-compose.yml`. Caddy handles the ACME HTTP-01
challenge and certificate renewal automatically — no other configuration
needed for a single-domain deployment.

### 4. Cron endpoints

Both `/api/cron/*` routes are already implemented and secured by the
`x-cron-secret` header (compared against `CRON_SECRET`, fail-closed as of
the recent security fix). Nothing in the app needs to change. The runbook
documents adding two lines to the VM's `crontab -e`:

```cron
0 * * * * curl -fsS -H "x-cron-secret: $CRON_SECRET" https://<subdomain>/api/cron/crisis-follow-up >/dev/null
0 9 * * 1 curl -fsS -H "x-cron-secret: $CRON_SECRET" https://<subdomain>/api/cron/weekly-reflection >/dev/null
```

No sidecar container — the app already exposes plain HTTP(S) endpoints for
this, and the VM's own cron is the simplest thing that can call them.

### Error Handling

- If `drizzle-kit migrate` fails on container start (e.g., a bad migration),
  the container exits non-zero and Docker's `restart: unless-stopped` will
  keep retrying — this surfaces the failure in `docker compose logs` rather
  than silently starting a server against a stale schema.
- Caddy's automatic HTTPS requires the subdomain's DNS to already resolve to
  the VM's public IP and ports 80/443 reachable from the internet (for the
  ACME challenge) — the runbook calls this out as a precondition to check
  before first deploy, since a DNS/port-forwarding mistake here is the most
  likely first-deploy failure mode.

### Testing

This is infrastructure configuration, not application code — there's no
unit-testable logic here. Verification is: `docker compose config` validates
the compose file parses and interpolates correctly (run locally, without
starting anything), and the runbook's steps are written to be followed
literally on the actual VM (the real verification, which happens outside
this repo).
