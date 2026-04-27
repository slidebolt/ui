pnpm install && rm -rf apps/web/node_modules/.vite && pnpm dlx dotenv-cli -e .env.dev -- bash -c 'pnpm --filter web dev'
