FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

# ── build ─────────────────────────────────────────────────────────────────────
FROM base AS build
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile
COPY apps/web ./apps/web
ARG VERSION=dev
ENV VITE_APP_VERSION=$VERSION
RUN pnpm --filter web build

# ── prod: nginx serving static files ─────────────────────────────────────────
FROM nginx:1.27-alpine AS prod
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 40003
CMD ["nginx", "-g", "daemon off;"]
