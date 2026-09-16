# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
# Installed directly via npm, not corepack: corepack's on-demand fetch of a
# pinned packageManager version has failed twice in this project's Dokploy
# build (Nixpacks), for two different pnpm versions, with the same
# "Cannot find module .../corepack/pnpm/<version>/bin/pnpm.cjs" error. This
# Dockerfile exists specifically to sidestep that fetch mechanism.
RUN npm install -g pnpm@12.3.4

# ---- deps: install dependencies (cached unless lockfile changes) --------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder: generate the Prisma client and build the app --------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Not a real connection — prisma generate only reads schema.prisma, and no
# route fetches data at build time (see docs/plan.md, all protected routes
# are dynamic). The real DATABASE_URL is provided at runtime by Dokploy.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN pnpm exec prisma generate
RUN pnpm run build

# ---- runner: minimal production image ------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
