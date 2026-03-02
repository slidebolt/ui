### `ui` repository

#### Project Overview

This repository contains the user interface for the Slidebolt project. It's a full-stack application built using a modern technology stack, designed for production and containerized for easy deployment.

#### Architecture

The `ui` repository is a monorepo managed with pnpm workspaces and Turborepo. This structure allows for a streamlined development workflow and efficient code sharing between the different parts of the application.

-   **Monorepo**: Turborepo + pnpm workspaces
-   **Frontend**: Vite + React + Tailwind CSS + Material UI
-   **Backend**: Fastify (Node.js)
-   **Database**: PostgreSQL + Drizzle ORM
-   **Infrastructure**: Docker Compose

#### Key Files

| File | Description |
| :--- | :--- |
| `pnpm-workspace.yaml` | Defines the pnpm workspace, which includes the `apps` and `packages` directories. |
| `turbo.json` | Configures Turborepo, defining the task pipeline for building, testing, and linting the monorepo. |
| `package.json` | The root `package.json` file, containing scripts for managing the entire monorepo. |
| `apps/web/package.json` | `package.json` for the web frontend, with scripts for development, building, and testing the React application. |
| `apps/api/package.json` | `package.json` for the backend API, with scripts for development, building, and testing the Fastify application. |
| `packages/database/package.json`| `package.json` for the shared database package, which contains the Drizzle ORM schema and client. |
| `docker-compose.dev.yml`| Defines the services for the development environment, including the database, API, and web frontend. |

#### Available Commands

| Command | Description |
| :--- | :--- |
| `pnpm install` | Installs all dependencies for the monorepo. |
| `pnpm run dev` | Starts the development environment using Docker Compose. |
| `pnpm run prod`| Starts the production environment using Docker Compose. |
| `pnpm run build` | Builds all the applications and packages in the monorepo using Turborepo. |
| `pnpm run lint`| Lints all the applications and packages in the monorepo using Turborepo. |
| `pnpm run test`| Runs all the tests in the monorepo. |
| `pnpm --filter web dev` | Starts the development server for the web frontend. |
| `pnpm --filter api dev` | Starts the development server for the backend API. |

#### Workspaces

-   **`apps/web`**: The React-based web frontend.
-   **`apps/api`**: The Fastify-based backend API.
-   **`packages/database`**: A shared package containing the Drizzle ORM schema, migrations, and database client.
