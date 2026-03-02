# SQL Learn

An interactive SQL learning platform where users practice writing SQL queries in isolated sandboxed environments, receive instant feedback, AI-powered hints, and track their progress through guided assignments.

---

## Project Structure

```
cipher-school/
├── backend/       # Express + TypeScript API server
│   ├── README.md  # Backend documentation (architecture, API docs, setup)
│   └── ...
├── frontend/      # Next.js 16 + React 19 web app
│   ├── README.md  # Frontend documentation (tech stack, setup)
│   └── ...
```

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Docker** & **Docker Compose** (for PostgreSQL)
- **MongoDB** (local instance or MongoDB Atlas)

### 1. Backend

```bash
cd backend
npm install
docker compose up -d          # Start PostgreSQL
cp .env.example .env          # Configure environment variables
npx tsx src/utils/seedAssignment.ts   # Seed assignments into MongoDB
npm run dev                   # Starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local    # Configure environment variables
npm run dev                   # Starts on http://localhost:3000
```

---

## Environment Variables

See each sub-project for the full list:

- [Backend environment variables](backend/README.md#5-environment-variables) — MongoDB, PostgreSQL, AI config, etc.
- [Frontend environment variables](frontend/README.md#4-environment-variables) — API URL

Example files are provided:

- `backend/.env.example`
- `frontend/.env.example`

---

## Tech Stack

| Layer        | Technology                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------- |
| **Frontend** | Next.js 16, React 19, TypeScript, Monaco Editor, Zustand, TanStack React Query, SCSS Modules |
| **Backend**  | Express 5, TypeScript, Mongoose (MongoDB), pg (PostgreSQL)                                   |
| **Database** | MongoDB (assignments, progress, metadata), PostgreSQL (sandboxed user schemas)               |
| **AI**       | OpenAI-compatible API for hint generation (optional)                                         |
| **Infra**    | Docker Compose (PostgreSQL)                                                                  |

---

## Documentation

- [Backend README](backend/README.md) — Architecture, API documentation, database schema, full setup guide
- [Frontend README](frontend/README.md) — Component structure, tech choices, setup guide
