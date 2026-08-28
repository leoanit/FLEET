# FleetOS — Fleet Management System

A full-stack fleet management and dispatch platform: vehicle/driver registries, dispatch scheduling, live GPS telemetry over WebSockets, service/maintenance logs, and analytics.

- **Frontend**: React 18 + TypeScript + Vite, Tailwind CSS, Zustand, TanStack Query/Table, Mapbox GL
- **Backend**: Node.js + Express + TypeScript, MongoDB (Mongoose), JWT auth, `ws` for real-time telemetry

## Project structure

```
fleet-management-system/
├── src/            # Frontend (React app)
├── server/         # Backend (Express API + WebSocket server)
├── .env            # Frontend environment variables
└── server/.env     # Backend environment variables
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (or a connection string to a remote instance)
- A free [Mapbox](https://mapbox.com) account for a public access token (used for the GPS map view)

## 1. Clone and install dependencies

Install the frontend and backend dependencies separately — they are two independent npm projects.

```bash
# Frontend (run from the repo root)
npm install

# Backend
cd server
npm install
```

## 2. Configure environment variables

### Frontend — `.env` (repo root)

```env
# Mapbox public token — get yours free at https://mapbox.com → Account → Tokens
# Tokens start with "pk." and are safe to expose in the browser
VITE_MAPBOX_TOKEN=your_mapbox_public_token

# Optional — only needed if the backend isn't on http://localhost:5000
# VITE_API_URL=http://localhost:5000/api
```

### Backend — `server/.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fleetos
JWT_SECRET=replace_with_a_long_random_secret
```

`.env` files are gitignored and **not** checked into the repo — copy `.env.example` → `.env` (repo root) and `server/.env.example` → `server/.env`, then fill in your own values (a Mapbox token, and a `JWT_SECRET` of your choosing).

## 3. Start MongoDB

Make sure a MongoDB server is running and reachable at the `MONGODB_URI` above. On Windows, either run `mongod` directly or start it as a service.

## 4. Run the backend

```bash
cd server
npm run dev
```

This starts the API on `http://localhost:5000` (health check at `/health`) and the WebSocket telemetry server on the same port.

**First run / empty database:** the server auto-seeds baseline data (demo vehicles, drivers, dispatches, service logs) when `NODE_ENV` is not `production`, using fixed default credentials for local development:

| Role       | Email                          | Password       |
|------------|---------------------------------|----------------|
| Admin      | `admin@fleetos.com`             | `admin123`     |
| Dispatcher | `dispatcher@fleetos.com`        | `dispatcher123`|
| Driver     | any seeded driver email (e.g. `david.mwangi@fleetos.co.ke`) | `driver123` |

These are dev-only defaults, not production-safe — we'll replace this with proper verification-code (email/SMS OTP) login before shipping. Accounts created later through the app (enrolling a new driver, resetting a password) still get a random one-time password as before.

To force re-seeding or disable it, set `SEED_DB=true` / `SEED_DB=false` in `server/.env`.

## 5. Run the frontend

In a separate terminal, from the repo root:

```bash
npm run dev
```

The app runs at `http://localhost:3000` and proxies `/api` requests to the backend at `http://localhost:5000` (see `vite.config.ts`).

## 6. Log in

Open `http://localhost:3000/login` and sign in with one of the seeded accounts printed to the backend terminal in step 4 (admin, dispatcher, or one of the driver/operator accounts). You'll be prompted to set a new password immediately after your first login.

## Available scripts

### Frontend (repo root)

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

### Backend (`server/`)

| Command | Description |
|---|---|
| `npm run dev` | Start the API with hot-reload (`ts-node-dev`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server from `dist/` |

## Troubleshooting

- **`Port 5000 is already in use`**: the backend logs a ready-to-run PowerShell command to free the port — see the terminal output, or change `PORT` in `server/.env`.
- **Map doesn't load / blank tiles**: check `VITE_MAPBOX_TOKEN` in the root `.env` is set to a valid Mapbox public token.
- **Live GPS updates not appearing**: confirm the backend is running and the WebSocket connects (check the browser console for `Fleet Telemetry WebSocket Connected`). If the socket can't connect, the frontend falls back to a local simulated telemetry feed so the map still animates.
- **MongoDB connection errors**: the backend retries every 5 seconds and logs `❌ MongoDB connection failed` until it can reach `MONGODB_URI`.
