# UI Production Deployment

The Slidebolt UI is deployed as a containerized stack using Docker Compose.

## Prerequisites

Before deploying, ensure you have configured your production environment variables:

1.  **Environment Files**: Copy the examples and fill in your production secrets.
    ```bash
    cp .env.prod.example .env.prod
    # Create a secrets file for sensitive data
    touch .env.prod.secrets
    ```
2.  **Configuration**: Edit `.env.prod` to point to your production gateway and database settings.

## Deployment Steps

1.  **Start the Stack**:
    ```bash
    pnpm run prod
    ```
    This command uses `docker-compose.prod.yml` to:
    *   Build optimized images for the Web and API apps.
    *   Start a production PostgreSQL database.
    *   Launch the Web frontend behind an Nginx proxy.
    *   Launch the Fastify API.

2.  **Verify**: Access the UI via the port configured in your `.env.prod`.

## Maintenance

*   **Logs**: `docker compose -f docker-compose.prod.yml logs -f`
*   **Updates**: Pull the latest code and run `pnpm run prod` again to rebuild and restart the containers.
*   **Database**: The production database uses a Docker volume for persistent storage. Migrations are handled automatically by the API container on startup.
