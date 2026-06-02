# syntax=docker/dockerfile:1

# ── Stage 1: Builder ─────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma

# Install ALL deps (including devDeps needed for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript → dist/
RUN npm run build

# ── Stage 2: Production Runner ───────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy only what is needed at runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Run as non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser \
  && chown -R appuser:nodejs /app
USER appuser

EXPOSE 4000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
