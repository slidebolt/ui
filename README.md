# src

A production-ready, containerized full-stack application template.

## Project Architecture
- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Vite + React + Tailwind CSS + Material UI
- **Backend**: Fastify (Node.js)
- **Database**: PostgreSQL + Drizzle ORM
- **Infrastructure**: Docker Compose

## Quick Start (Development)

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Start Development Environment**:
   ```bash
   pnpm run dev
   ```
   Starts the database, API, and web frontend via Docker Compose. The API automatically pushes the schema and creates the default admin user on first boot.

## Project Structure
- `apps/api`: Fastify backend
- `apps/web`: React frontend
- `packages/database`: Shared Drizzle schema and client
