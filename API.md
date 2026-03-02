# SlideBolt Web API

The Web API (`apps/api`) is the backend for the SlideBolt web interface. It handles user authentication, session management, and provides a secure, RBAC-protected proxy to the Core API.

## Connection Details

- **Base URL**: `http://<host>:40001`
- **Port (Container)**: `40001`
- **Protocol**: HTTP/1.1 (HTTPS in production via Traefik)

## Authentication

The Web API uses session-based authentication via cookies.

1.  **Login**: `POST /api/login` with `{ "username": "...", "password": "..." }`
2.  **Session**: A session cookie is returned and must be included in subsequent requests.
3.  **Logout**: `POST /api/logout`

## Role-Based Access Control (RBAC)

All proxied requests to the Core API require an active session and valid permissions. Permissions are assigned to roles, which are assigned to users.

## Key Endpoints

-   **Auth**: `/api/login`, `/api/logout`, `/api/me`
-   **User Management**: `/api/users`, `/api/roles`
-   **Proxied Core API**: `/api/plugins/*`, `/api/search/*`, `/api/schema/*`, etc. (These map directly to Core API endpoints).

## Accessing Core API via Proxy

When calling the Web API, any request to `/api/plugins` will be automatically authenticated against the UI database and then forwarded to the Core API at its internal URL.

```bash
# Example: List plugins via the Web API (requires session cookie)
curl -b cookies.txt http://localhost:40001/api/plugins
```
