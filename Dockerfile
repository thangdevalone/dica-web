# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24-bookworm-slim

# 1. Base stage with system tools
FROM ${NODE_IMAGE} AS base
RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# 2. Dependencies installation
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 3. Build application
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js inlines NEXT_PUBLIC_* variables into the client bundle at build time
ARG NEXT_PUBLIC_API_URL="/api/v1"
ARG NEXT_PUBLIC_DEFAULT_ORGANIZATION_CODE="DICA"
ARG NEXT_PUBLIC_APP_NAME="DICA Admin"
ARG NEXT_PUBLIC_APP_DESCRIPTION="Hệ Thống Quản Trị Chuỗi Cung Ứng & Tồn Kho F&B"
ARG NEXT_PUBLIC_DEFAULT_THEME="system"

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_DEFAULT_ORGANIZATION_CODE=${NEXT_PUBLIC_DEFAULT_ORGANIZATION_CODE} \
    NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME} \
    NEXT_PUBLIC_APP_DESCRIPTION=${NEXT_PUBLIC_APP_DESCRIPTION} \
    NEXT_PUBLIC_DEFAULT_THEME=${NEXT_PUBLIC_DEFAULT_THEME} \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

RUN npm run build

# 4. Production runtime runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 nextjs

# Copy static assets and standalone server bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>{if(!r.ok&&r.status!==307&&r.status!==308)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
