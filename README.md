# FleetOS — Fleet Management System

A full-stack fleet management and dispatch platform for managing vehicles, drivers, dispatch operations, GPS telemetry, maintenance records, and fleet analytics.

## Features

* Vehicle and driver management
* Dispatch scheduling and management
* Live GPS telemetry using WebSockets
* Service and maintenance records
* Fleet analytics and reporting
* JWT-based authentication
* Role-based access for administrators, dispatchers, and drivers
* Interactive GPS map powered by Mapbox
* MongoDB Atlas cloud database

## Technology Stack

### Frontend

* React 18
* TypeScript
* Vite
* Tailwind CSS
* Zustand
* TanStack Query
* TanStack Table
* Mapbox GL

### Backend

* Node.js
* Express
* TypeScript
* MongoDB Atlas
* Mongoose
* JWT authentication
* `ws` WebSocket server

## Project Structure

```text
FLEET/
├── src/                  # Frontend React application
├── server/               # Backend Express API + WebSocket server
├── .env                  # Frontend environment variables (local only)
├── server/.env           # Backend environment variables (local only)
├── .env.example          # Frontend environment variable template
└── server/.env.example   # Backend environment variable template
```

## Prerequisites

Before running FleetOS, install:

* Node.js 18+ and npm
* A MongoDB Atlas account
* A Mapbox account for the GPS map
* Git

**MongoDB does not need to be installed locally.**

FleetOS connects directly to MongoDB Atlas through a MongoDB connection string.

## 1. Clone the Repository

```bash
git clone https://github.com/leoanit/FLEET.git
cd FLEET
```

## 2. Install Dependencies

The frontend and backend are separate npm projects.

### Frontend

From the repository root:

```bash
npm install
```

### Backend

```bash
cd server
npm install
```

Then return to the project root when needed:

```bash
cd ..
```

## 3. Configure MongoDB Atlas

FleetOS uses MongoDB Atlas as its cloud database.

Create or use a MongoDB Atlas cluster and make sure:

1. A database user has been created.
2. The user's credentials are available.
3. Your current IP address is allowed in the Atlas Network Access settings.
4. You have the MongoDB connection string for your cluster.

Your connection string should follow this format:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/fleetos
```

Do **not** commit your real MongoDB Atlas credentials to GitHub.

## 4. Configure Environment Variables

### Frontend — `.env`

Create a `.env` file in the repository root:

```env
VITE_MAPBOX_TOKEN=your_mapbox_public_token

# Optional — only needed if the backend isn't running on localhost:5000
# VITE_API_URL=http://localhost:5000/api
```

The Mapbox public token can be obtained from your Mapbox account.

### Backend — `server/.env`

Create:

```text
server/.env
```

Add:

```env
PORT=5000

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/fleetos

JWT_SECRET=replace_with_a_long_random_secret

SEED_DB=true
```

Replace the MongoDB Atlas connection string with your own credentials.

**Never commit `server/.env` to GitHub.**

The project should use `.gitignore` to prevent environment files from being committed.

## 5. MongoDB Atlas Network Access

Because the database is hosted in MongoDB Atlas, the computer running the backend must be allowed to connect to the Atlas cluster.

In MongoDB Atlas, go to:

**Security → Network Access**

and add the IP address of the computer/network running the application.

If you move the application to another computer or network, you may need to add the new IP address to the Atlas access list.

## 6. Run the Backend

Open Terminal 1:

```bash
cd /path/to/FLEET/server
npm run dev
```

The backend starts on:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

The WebSocket telemetry server runs on the same backend port.

The backend connects directly to the MongoDB Atlas cloud database.

## 7. First Run / Database Seeding

When the database is empty and `NODE_ENV` is not `production`, the server can automatically seed baseline development data, including:

* Demo vehicles
* Drivers
* Dispatches
* Service logs
* Development user accounts

Development login credentials are displayed in the backend terminal when the database is seeded.

Example development accounts may include:

| Role       | Email                    | Password        |
| ---------- | ------------------------ | --------------- |
| Admin      | `admin@fleetos.com`      | `admin123`      |
| Dispatcher | `dispatcher@fleetos.com` | `dispatcher123` |
| Driver     | Seeded driver account    | `driver123`     |

These credentials are for development/testing only and should not be used in production.

To control database seeding:

```env
SEED_DB=true
```

or:

```env
SEED_DB=false
```

## 8. Run the Frontend

Open Terminal 2 and run:

```bash
cd /path/to/FLEET
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

The Vite development server proxies API requests to:

```text
http://localhost:5000
```

See `vite.config.ts` for the proxy configuration.

## 9. Log In

Open:

```text
http://localhost:3000/login
```

Use one of the development accounts displayed by the backend during database seeding.

After the initial login, follow the application's password setup flow if prompted.

## Available Scripts

### Frontend

Run these commands from the repository root:

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the Vite development server   |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build        |
| `npm run lint`    | Run ESLint                          |

### Backend

Run these commands from `server/`:

| Command         | Description                        |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start the API with hot reload      |
| `npm run build` | Compile TypeScript to `dist/`      |
| `npm start`     | Run the compiled production server |

## Troubleshooting

### Port 5000 is already in use

Another application may already be using port 5000.

Either stop the application using the port or change the backend port in:

```text
server/.env
```

For example:

```env
PORT=5001
```

Make sure the frontend API configuration matches the new backend port if necessary.

### Map doesn't load

Check that the root `.env` contains a valid Mapbox public token:

```env
VITE_MAPBOX_TOKEN=your_mapbox_public_token
```

Then restart the frontend development server.

### Live GPS updates are not appearing

Make sure the backend is running and the WebSocket connection is established.

Check the browser console for:

```text
Fleet Telemetry WebSocket Connected
```

If the WebSocket cannot connect, the frontend may fall back to simulated telemetry depending on the current application configuration.

### MongoDB Atlas connection errors

Check the following:

1. `MONGODB_URI` is correctly configured in `server/.env`.
2. Your MongoDB Atlas username and password are correct.
3. Your computer's IP address is allowed in MongoDB Atlas Network Access.
4. Your Atlas cluster is running.
5. Your internet connection is working.
6. Special characters in the database password are properly URL-encoded in the MongoDB connection string.

The backend will retry the MongoDB connection and report connection errors in the terminal.

## Database Architecture

FleetOS uses MongoDB Atlas as its centralized cloud database.

```text
                    ┌─────────────────────┐
                    │     FleetOS UI      │
                    │ React + TypeScript   │
                    └──────────┬──────────┘
                               │
                               │ HTTP / WebSocket
                               ▼
                    ┌─────────────────────┐
                    │    FleetOS API      │
                    │ Node + Express      │
                    └──────────┬──────────┘
                               │
                               │ Mongoose
                               ▼
                    ┌─────────────────────┐
                    │   MongoDB Atlas     │
                    │    Cloud Database   │
                    └─────────────────────┘
```

Because MongoDB Atlas is cloud-hosted, a local MongoDB server or MongoDB Compass installation is **not required** to run FleetOS.

## Security

Environment files containing credentials are intentionally excluded from version control.

Never commit:

```text
.env
server/.env
```

Never expose:

* MongoDB Atlas passwords
* JWT secrets
* Private API keys
* Other application credentials

Use `.env.example` files to document required environment variables without exposing real credentials.

## License

This project is maintained as the FleetOS Fleet Management System.
