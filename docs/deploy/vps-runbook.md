# Deploying HeadCheck to a VPS (Docker Compose + Caddy)

This runbook covers deploying this repo to a fresh Linux VM (a Proxmox VM
works the same as any VPS) using the `docker-compose.yml` / `Dockerfile` /
`Caddyfile` already in this repo.

## 1. Prerequisites

- A VM running Debian 12 or Ubuntu 24.04 LTS, 2 vCPU / 4 GB RAM / 40 GB disk
  minimum.
- A subdomain (e.g. `app.yourdomain.com`) with its DNS **A record already
  pointing at the VM's public IP**. Caddy's automatic HTTPS needs this to
  resolve correctly *before* the first deploy — it also needs ports 80 and
  443 reachable from the internet (for the ACME HTTP-01 challenge), so if
  the VM is behind a router/box without a public IP, forward ports 80 and
  443 to the VM first.
- Docker and the Compose plugin installed on the VM:

  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  # log out and back in for the group change to take effect
  ```

## 2. Get the code onto the VM

```bash
git clone https://github.com/luctano18/HEADCHECK-SAAS.git
cd HEADCHECK-SAAS
```

## 3. Create the `.env` file

`docker-compose.yml` reads these from a `.env` file in the same directory
(never commit this file). Create `.env`:

```bash
# Domain (Caddy)
DOMAIN=app.yourdomain.com

# Database
MYSQL_ROOT_PASSWORD=<generate a strong random password>
DATABASE_URL=mysql://root:<same password as above>@db:3306/headcheck

# Auth
JWT_SECRET=<generate a strong random string>

# Google OAuth (create credentials in Google Cloud Console)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_BASE=https://app.yourdomain.com

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=HeadCheck AI <notifications@app.yourdomain.com>

# AI
OPENAI_API_KEY=sk-...

# Session signing (required — see note below; any stable non-empty string works)
VITE_APP_ID=headcheck-selfhosted

# Cron auth (required — the cron endpoints reject every request if this is unset)
CRON_SECRET=<generate a strong random string>

# CORS — must match the public URL
CORS_ORIGIN=https://app.yourdomain.com

# Web push (optional — generate with `npx web-push generate-vapid-keys`)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Stripe (optional — only if monetization is enabled)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_INSTITUTION_PRICE_ID=
```

Generate strong random values for `JWT_SECRET`, `CRON_SECRET`, and
`MYSQL_ROOT_PASSWORD` with `openssl rand -hex 32`.

**`VITE_APP_ID` is required, despite the name.** Every session token
(email/password login and Google OAuth alike) is signed with
`{ openId, appId, name }`, and `server/_core/sdk.ts`'s `verifySession`
rejects any token where `appId` is empty — so without this set, logins
silently fail to persist (the user is bounced back to `/` right after
signing in). It isn't checked against anything external, so any stable
non-empty string works; just don't change it after users have live
sessions, or their sessions will stop validating.

Note: a few other variables show up in `server/_core/env.ts`
(`BUILT_IN_FORGE_API_URL`/`KEY`, `OAUTH_SERVER_URL`,
`OWNER_OPEN_ID`) that look like leftovers from a different hosting
platform's built-in integrations. They are not in the app's hard-required
list (`server/_core/index.ts`) and this deployment doesn't use them — leave
them unset.

## 4. First deploy

```bash
docker compose up -d --build
docker compose logs -f app
```

Watch for `✅ All required environment variables are set` and
`Server running on http://localhost:3000/` in the logs. The `app`
container's start command runs `drizzle-kit migrate` before starting the
server, so the database schema is created automatically on first boot.

Visit `https://app.yourdomain.com` — Caddy should present a valid
Let's Encrypt certificate automatically (first request may take a few
seconds while it completes the ACME challenge).

## 5. Set up the cron jobs

The app exposes two cron endpoints, secured by the `x-cron-secret` header
(must match `CRON_SECRET` from the `.env` file). Nothing in Docker calls
these on a schedule — add two lines to the VM's own crontab:

```bash
crontab -e
```

```cron
0 * * * * curl -fsS -H "x-cron-secret: YOUR_CRON_SECRET" https://app.yourdomain.com/api/cron/crisis-follow-up >/dev/null
0 9 * * 1 curl -fsS -H "x-cron-secret: YOUR_CRON_SECRET" https://app.yourdomain.com/api/cron/weekly-reflection >/dev/null
```

(Replace `YOUR_CRON_SECRET` with the actual value from `.env`.) The first
line polls hourly for crisis follow-ups; the second runs weekly reflections
every Monday at 9:00 AM UTC — adjust the hour if the VM's cron isn't in
UTC (check with `timedatectl`).

## 6. Redeploying after a change

```bash
git pull
docker compose up -d --build
```

This rebuilds the `app` image and restarts it (re-running any pending
migrations); `db` and `caddy` are untouched unless their config changed.

## 7. Troubleshooting

- **Caddy can't get a certificate:** confirm the subdomain's DNS actually
  resolves to this VM's public IP (`dig app.yourdomain.com`) and that ports
  80/443 are reachable from the public internet, not just the local
  network. Check `docker compose logs caddy`.
- **App container keeps restarting:** check `docker compose logs app` —
  most likely a missing required environment variable (the app validates
  and exits on boot with a clear list of what's missing) or a failed
  migration.
- **Cron endpoints return 401:** the `x-cron-secret` header doesn't match
  `CRON_SECRET` in `.env` — double check for stray whitespace/quotes when
  copying the value into the crontab line.
