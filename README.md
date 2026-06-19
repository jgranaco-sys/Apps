# Apps

# 🏆 Score Room — Multiplayer Score Assignment Game

A real-time multiplayer web game where an admin creates a room, players join via a shareable link/code, and each player is secretly assigned a unique score. Once the admin opens the reveal phase, players can reveal their score one by one while everyone watches the live summary board.

---

## Features

- **Create a room** — become admin, set score limits and capacity rules
- **Shareable room code/link** — share a 6-character code or direct URL
- **Secret score assignment** — each player gets a randomly assigned `X - Y` score on join
- **Reveal phase** — admin controls when players can reveal their score
- **Live summary board** — real-time updates via Socket.IO as players reveal
- **Configurable capacity** — `(maxLocal+1) × (maxVisit+1) × maxRepetitions` players max
- **Duplicate/repetition control** — `allowDuplicates` + `maxRepetitionsPerScore` settings

---

## Tech Stack

| Layer     | Tech                            |
|-----------|----------------------------------|
| Backend   | Node.js + Express + Socket.IO   |
| Database  | SQLite via Prisma ORM           |
| Frontend  | React + Vite + TypeScript       |
| Realtime  | Socket.IO client                |

---

## Project Structure

```
Apps/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Prisma schema (Room, User, Assignment)
│   ├── src/
│   │   ├── server.ts            # HTTP + Socket.IO server entry
│   │   ├── app.ts               # Express app factory
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── modules/rooms/       # REST controllers + router
│   │   ├── sockets/             # Socket.IO event handlers
│   │   └── utils/scorePool.ts   # Score pool generation + Fisher-Yates shuffle
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.tsx         # Create/Join room forms
    │   │   └── Room.tsx         # Main game room page
    │   ├── components/
    │   │   ├── AdminPanel.tsx   # Admin controls + room info
    │   │   ├── PlayerPanel.tsx  # Player waiting/reveal UI
    │   │   └── SummaryBoard.tsx # Live summary list
    │   ├── api.ts               # REST API client
    │   └── socket.ts            # Socket.IO client setup
    ├── .env.example
    └── package.json
```

---

## Setup & Run

### Prerequisites

- Node.js 18+ and npm

### 1. Clone the repo

```bash
git clone https://github.com/jgranaco-sys/Apps.git
cd Apps
```

### 2. Backend setup

```bash
cd backend

# Copy env file and configure if needed
cp .env.example .env

# Install dependencies
npm install

# Create the SQLite database and run migrations
npm run db:push

# Start the dev server (hot-reload)
npm run dev
```

Backend runs at: **http://localhost:4000**

### 3. Frontend setup

```bash
cd frontend

# Copy env file
cp .env.example .env

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Default                    | Description                  |
|----------------|----------------------------|------------------------------|
| `DATABASE_URL` | `file:./dev.db`            | SQLite database path         |
| `PORT`         | `4000`                     | Backend server port          |
| `FRONTEND_URL` | `http://localhost:5173`    | Allowed CORS origin          |

### Frontend (`frontend/.env`)

| Variable          | Default                  | Description            |
|-------------------|--------------------------|------------------------|
| `VITE_API_URL`    | `http://localhost:4000`  | Backend REST API URL   |
| `VITE_SOCKET_URL` | `http://localhost:4000`  | Socket.IO server URL   |

---

## API Endpoints

| Method | Path                          | Description                         |
|--------|-------------------------------|-------------------------------------|
| POST   | `/api/rooms`                  | Create room + admin user            |
| POST   | `/api/rooms/:code/join`       | Join room (assigns secret score)    |
| GET    | `/api/rooms/:code`            | Get room snapshot (safe)            |
| POST   | `/api/rooms/:code/reveal-open`| Admin opens reveal phase            |
| POST   | `/api/rooms/:code/reveal-me`  | Player reveals their own score      |
| GET    | `/api/rooms/:code/summary`    | Get summary of all players + status |

## Socket.IO Events

| Event                 | Direction        | Description                          |
|-----------------------|------------------|--------------------------------------|
| `join:room`           | Client → Server  | Subscribe to room updates            |
| `room:joined`         | Server → Room    | New player joined                    |
| `room:status_changed` | Server → Room    | Room status changed (e.g. reveal open)|
| `summary:updated`     | Server → Room    | A player revealed their score        |

---

## Game Flow

1. **Admin** goes to Home → fills nickname + score settings → **Create Room**
2. A 6-character room code is shown + shareable link
3. Admin shares the link: `http://localhost:5173?join=XXXXXX`
4. **Players** click the link or paste the code → **Join Room**
5. Each player is secretly assigned a score (hidden until reveal)
6. When ready, **Admin clicks "Open Reveal Phase"**
7. Each player sees **"Reveal My Score!"** button and clicks it
8. The **summary board** updates live for everyone as scores are revealed

---

## npm Scripts

### Backend

```bash
npm run dev        # Start dev server with hot-reload (ts-node-dev)
npm run build      # Compile TypeScript to dist/
npm run start      # Run compiled dist/server.js
npm run db:push    # Push Prisma schema to SQLite (creates DB)
npm run db:migrate # Run Prisma migrations
npm run db:generate # Regenerate Prisma client
```

### Frontend

```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## Testing the App Locally

1. Open two browser tabs/windows at `http://localhost:5173`
2. **Tab 1**: Create a room (set nickname + score range)
3. Copy the room code shown in the admin panel
4. **Tab 2**: Join the room using the code
5. **Tab 1** (admin): Click **"Open Reveal Phase"**
6. Both tabs: Click **"Reveal My Score!"** and watch the summary board update live

---

## License

MIT
