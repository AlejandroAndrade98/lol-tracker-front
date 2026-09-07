# LoL Tracker

Personal Performance Dashboard for Jordan Belfort#LAN29 on LAN.

This repository is frontend-only. It does not call Riot APIs, does not connect to Supabase, does not implement auth, and does not create backend routes. All real data comes from the REST API configured with `VITE_API_BASE_URL`.

## Stack

- TanStack Start
- Vite
- React 19
- TypeScript strict mode
- Tailwind CSS
- Recharts
- React Query
- shadcn/Radix UI primitives

## Node

Use Node 22.12.0 or newer.

TanStack Start 1.168.32 and related `@tanstack/start-*` packages declare `node >=22.12.0`, so this project keeps that requirement for stable local development and Vercel builds. The repo includes `.nvmrc` with `22.12.0`.

## Environment

Create a local `.env` when needed:

```sh
VITE_API_BASE_URL=http://localhost:3000
VITE_USE_MOCK_DATA=false
```

`VITE_API_BASE_URL` is public browser configuration, not a secret. Do not place `RIOT_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or other backend secrets in this frontend.

## Local Development

```sh
nvm use
npm install
npm run dev
```

The frontend dev server uses `http://127.0.0.1:8080` so the backend can keep `http://localhost:3000`.

## Mock Mode

Mock mode is only for local UI development.

```sh
VITE_USE_MOCK_DATA=true
npm run dev
```

When `VITE_USE_MOCK_DATA=false`, the frontend uses only the REST API. It does not mix mock and real sources.

## API Mode

The backend must expose:

- `GET /health`
- `GET /api/player`
- `GET /api/rank`
- `GET /api/rank/history`
- `GET /api/matches`
- `GET /api/matches/:matchId`
- `GET /api/roles`
- `GET /api/champions`
- `GET /api/champions/:championName`
- `GET /api/progress`
- `GET /api/performance/phases`
- `GET /api/deaths`
- `GET /api/farm`
- `GET /api/sessions`
- `GET /api/insights`
- `GET /api/goals`
- `POST /api/goals`
- `PATCH /api/goals/:id`
- `DELETE /api/goals/:id`
- `GET /api/goals/progress`
- `POST /api/sync`

`POST /api/sync` is only exposed as a discrete manual action in Settings.

## Build

```sh
npm run typecheck
npm run lint
npm run build
```

The build must not require the backend to be running. Runtime data fetching happens in the browser through React Query.

## Vercel Deployment

The repo includes `vercel.json`:

```json
{
  "framework": "tanstack-start"
}
```

TanStack Start deploys to Vercel through Nitro. The Vite config includes `tanstackStart()` and `nitro()`, which lets Vercel detect and build the app correctly.

In Vercel project settings, set:

```sh
VITE_API_BASE_URL=https://your-backend-domain.example
VITE_USE_MOCK_DATA=false
```

Do not configure backend secrets in Vercel for this frontend project.

## CORS

The frontend does not solve CORS with a proxy. Configure the backend to allow the deployed frontend origin, for example:

```txt
https://lol-tracker.vercel.app
```

## Architecture

- `src/api/*`: centralized REST API services and request client
- `src/lib/api.ts`: single switch between mock and real API mode
- `src/hooks/use-lol-data.ts`: React Query hooks for the UI
- `src/layouts/app-shell.tsx`: desktop sidebar, mobile nav, global header
- `src/components/lol-ui.tsx`: dashboard components, filters, charts, tables, cards
- `src/pages/*`: route-level product screens
- `src/routes/*`: TanStack file routes
- `src/types/api.ts`: frontend mirror of backend contracts
- `src/mocks/*`: deterministic local development data

## Routes

- `/` Overview
- `/matches` Matches
- `/matches/:matchId` Match detail
- `/champions` Champions
- `/champions/:championName` Champion detail
- `/progress` Progress, performance phases, deaths, farm, sessions
- `/roles` Roles
- `/insights` Insights
- `/goals` Goals CRUD
- `/settings` API status and runtime settings
