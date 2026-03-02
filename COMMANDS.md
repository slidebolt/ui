# UI Monorepo Commands

This repository is a monorepo managed by `pnpm` and `Turborepo`. Commands are run from the root directory.

## Environment Management (Docker)

| Command | Description |
| :--- | :--- |
| `pnpm run dev` | Starts the full development stack (Database, API, and Web) using Docker Compose. |
| `pnpm run prod` | Starts the production-configured stack using Docker Compose. |
| `pnpm run test` | Builds the project, starts the test environment, runs migrations, and executes all unit and E2E tests. |

## Development & Build

| Command | Description |
| :--- | :--- |
| `pnpm run build` | Builds all applications (`web`, `api`) and packages (`database`) in the monorepo. |
| `pnpm run lint` | Runs linting across the entire codebase. |
| `pnpm run db:migrate:dev` | Pushes the current schema to the development database. |

## Filtered Commands (App Specific)

You can target specific apps using the `--filter` flag:

- **Web**: `pnpm --filter web dev` (Vite dev server)
- **API**: `pnpm --filter api dev` (Fastify dev server via `tsx`)
- **Database**: `pnpm --filter @repo/database generate` (Generate Drizzle migrations)

## Helper Scripts

- `./dev.web.sh`: Shortcut for frontend development tasks.
- `./dev.api.sh`: Shortcut for API development tasks.
- `./dev.docker.sh`: Utility for Docker environment maintenance.
