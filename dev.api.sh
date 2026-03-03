pnpm install && pnpm dlx dotenv-cli -e .env.dev -- pnpm --filter @repo/database push && pnpm dlx dotenv-cli -e .env.dev -- bash -c 'pnpm --filter api dev'
