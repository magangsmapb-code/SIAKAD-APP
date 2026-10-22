# ==============================================================================
# Production Dockerfile for SIAKAD Backend API (NestJS 10 + Prisma + PostgreSQL)
# Multi-stage build for minimal container size and enhanced security
# ==============================================================================

# 1. Dependencies Stage
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# 2. Builder Stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build
# Prune dev dependencies for production runtime
RUN npm prune --production

# 3. Production Runner Stage
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl wget
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV APP_TIMEZONE=Asia/Jakarta

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy pruned dependencies, generated prisma client, and compiled dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/api/v1/health || exit 1

CMD ["node", "dist/src/main.js"]
