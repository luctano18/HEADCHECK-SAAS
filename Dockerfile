# Production Dockerfile for HeadCheck AI
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (patches/ must be present before install — package.json
# references patches/wouter@3.7.1.patch via pnpm.patchedDependencies)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build application
RUN pnpm build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Apply any pending migrations, then start the server. Safe to run on every
# start — drizzle-kit tracks applied migrations and no-ops if none are due.
CMD ["sh", "-c", "npx drizzle-kit migrate && node dist/index.js"]