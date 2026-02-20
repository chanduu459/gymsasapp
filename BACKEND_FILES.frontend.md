# Backend Files

This project’s backend lives primarily in the `server/` folder.

## Main backend area

- `server/index.ts` — Express app, routes, auth middleware, cron job, server startup
- `server/db.ts` — PostgreSQL pool configuration and database/table initialization

## Backend-related config

- `.env` — runtime environment values (DB credentials, port, JWT secret)
- `.env.example` — sample environment template
- `package.json` scripts:
  - `server` — run backend once
  - `server:dev` — run backend in watch mode

## Backend API route groups (inside `server/index.ts`)

- Auth: `/api/gyms/register`, `/api/auth/login`, `/api/auth/me`
- Members: `/api/members`
- Plans: `/api/plans`
- Subscriptions: `/api/subscriptions`
- Dashboard: `/api/dashboard/stats`
- Notifications: `/api/notifications`
- Audit Logs: `/api/audit-logs`
- Cron trigger: `/api/cron/check-expiring`
