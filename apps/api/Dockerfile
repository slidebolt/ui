FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

# ── deps: install all workspace deps (cached layer) ──────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
RUN pnpm install --frozen-lockfile

# ── build ─────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY packages/database ./packages/database
COPY apps/api ./apps/api
COPY turbo.json ./
RUN pnpm --filter @repo/database build
RUN pnpm --filter api build

# ── prod image ────────────────────────────────────────────────────────────────
FROM base AS prod
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
RUN pnpm install --frozen-lockfile

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/database/dist ./packages/database/dist
COPY packages/database/drizzle ./packages/database/drizzle
COPY packages/database/drizzle.config.ts ./packages/database/drizzle.config.ts
COPY packages/database/src ./packages/database/src

ENV NODE_ENV=production
ARG VERSION=dev
ENV APP_VERSION=$VERSION
WORKDIR /app/apps/api
EXPOSE 40001
# Apply SQL migrations then start server
CMD ["sh", "-c", "cd /app/packages/database && npx drizzle-kit migrate && cd /app/apps/api && node dist/index.js"]

