FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS dev
RUN pnpm install
EXPOSE 4000
CMD ["/bin/sh", "-c", "pnpm --filter @repo/database push && pnpm --filter api dev"]

FROM base AS build
RUN pnpm install
RUN pnpm run build

FROM base AS prod
RUN pnpm install --prod
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/packages/database/dist /app/packages/database/dist
EXPOSE 4000
CMD ["pnpm", "--filter", "api", "start"]
