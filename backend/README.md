# SQL Learn — Backend

An interactive SQL learning platform backend that provides sandboxed PostgreSQL environments for users to practice SQL queries against guided assignments. Each user gets an isolated database schema per assignment, ensuring safe, read-only query execution against pre-seeded sample data.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [Environment Variables](#5-environment-variables)
6. [API Documentation](#6-api-documentation)
7. [Authentication Flow](#7-authentication--identity-flow)
8. [Database Schema Explanation](#8-database-schema-explanation)
9. [How to Run Locally](#9-how-to-run-locally)
10. [Known Limitations](#10-known-limitations)
11. [Suggested Improvements](#11-suggested-improvements)

---

## 1. Project Overview

**SQL Learn** is a backend service that powers an interactive SQL practice platform. Its core capabilities:

- **Assignment Management** — Stores and serves SQL practice assignments (title, description, question, sample tables, expected output) from MongoDB.
- **Per-User Sandboxed Environments** — Dynamically provisions isolated PostgreSQL schemas for each (user, assignment) pair. Each schema contains the assignment's sample tables and data.
- **Secure Query Execution** — Accepts user-submitted SQL queries, validates them against a strict allowlist (only `SELECT` and `WITH`), blocks dangerous keywords (`INSERT`, `DROP`, `ALTER`, etc.), enforces a 5-second timeout, and executes them within the user's sandboxed schema.
- **Identity Tracking** — Uses a lightweight, token-less identity system via the `X-Identity-ID` header. If absent, auto-generates a guest UUID.

This is **not** a traditional authentication-based app — there are no JWTs, sessions, or login flows. Identity is passed as a request header.

---

## 2. Architecture

### Pattern: Layered Architecture (Route → Controller → Service → DB)

```
┌─────────────────────────────────────────────────────────┐
│                      Express App                        │
│  (CORS · JSON parser · Global error handler)            │
├─────────────────────────────────────────────────────────┤
│                      Routes                             │
│  /api/assignments   →  assignment.routes.ts             │
│  /api/sandbox       →  sandbox.routes.ts                │
├─────────────────────────────────────────────────────────┤
│                    Middleware                            │
│  identityMiddleware  (X-Identity-ID header check)       │
├─────────────────────────────────────────────────────────┤
│                   Controllers                           │
│  assignment.controller.ts  (list / get by ID)           │
│  sandbox.controller.ts     (init sandbox)               │
│  execution.controller.ts   (execute SQL query)          │
├─────────────────────────────────────────────────────────┤
│                    Services                             │
│  assignment.service.ts     (MongoDB CRUD)               │
│  sandbox.service.ts        (schema creation, seeding)   │
│  execution.service.ts      (validation, execution)      │
├─────────────────────────────────────────────────────────┤
│                   Databases                             │
│  MongoDB (Mongoose)  — Assignments, SandboxMeta         │
│  PostgreSQL (pg Pool) — User sandbox schemas & tables   │
└─────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
Client Request
  │
  ▼
Express Middleware (CORS → JSON parser)
  │
  ▼
Route Matching (/api/assignments or /api/sandbox)
  │
  ▼
[If sandbox route] → identityMiddleware
  │                   ├─ Has X-Identity-ID header? → attach to req.identityId
  │                   └─ Missing? → generate guest_{uuid}, set response header
  │
  ▼
Controller (input validation, delegates to service)
  │
  ▼
Service (business logic, DB queries)
  │
  ▼
Database (MongoDB via Mongoose / PostgreSQL via pg Pool)
  │
  ▼
Controller formats response using ApiResponse / throws ApiError
  │
  ▼
Global Error Handler (catches ApiError → structured JSON response)
  │
  ▼
Client Response
```

---

## 3. Tech Stack

| Category          | Technology                  | Version |
| ----------------- | --------------------------- | ------- |
| Runtime           | Node.js (via `tsx` watcher) | —       |
| Language          | TypeScript                  | ^5      |
| Framework         | Express                     | ^5.2.1  |
| MongoDB ODM       | Mongoose                    | ^9.2.3  |
| PostgreSQL Client | pg (node-postgres)          | ^8.19.0 |
| CORS              | cors                        | ^2.8.6  |
| Env Config        | dotenv                      | ^17.3.1 |
| Dev Runner        | tsx (watch mode)            | ^4.21.0 |
| Formatter         | Prettier                    | ^3.8.1  |
| Containerization  | Docker Compose (PostgreSQL) | —       |

**Notable:** The `package.json` references `@types/bun`, suggesting the project was scaffolded with Bun but actually runs via `tsx watch index.ts` (Node.js).

---

## 4. Folder Structure

```
backend/
├── index.ts                    # Entry point — boots server, connects DBs
├── app.ts                      # Express app setup — middleware, routes, error handler
├── constant.ts                 # Shared constants (DB_NAME = "sql-learn")
├── docker-compose.yaml         # PostgreSQL container definition
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript compiler configuration
└── src/
    ├── config/
    │   └── env.ts              # Loads & validates environment variables
    ├── controllers/
    │   ├── assignment.controller.ts   # Handles assignment list/detail requests
    │   ├── execution.controller.ts    # Handles SQL query execution requests
    │   └── sandbox.controller.ts      # Handles sandbox initialization requests
    ├── data/
    │   └── assignments.json    # Seed data for SQL assignments
    ├── db/
    │   ├── mongodb.ts          # MongoDB connection via Mongoose
    │   └── postgres.ts         # PostgreSQL connection pool via pg
    ├── middleware/
    │   └── identity.middleware.ts  # Extracts/generates user identity from headers
    ├── models/
    │   ├── assignment.model.ts    # Mongoose schema for Assignment documents
    │   └── sandboxMeta.model.ts   # Mongoose schema for SandboxMeta documents
    ├── routes/
    │   ├── assignment.routes.ts   # GET /api/assignments, GET /api/assignments/:id
    │   └── sandbox.routes.ts      # POST /api/sandbox/init, POST /api/sandbox/execute
    ├── services/
    │   ├── assignment.service.ts  # Assignment CRUD business logic
    │   ├── execution.service.ts   # SQL validation, execution, error conversion
    │   └── sandbox.service.ts     # Sandbox creation, table provisioning, data seeding
    ├── types/
    │   └── types.ts            # Shared interfaces, blocked/allowed keywords, constants
    └── utils/
        ├── ApiError.ts         # Custom error class with statusCode & structured fields
        ├── ApiResponse.ts      # Standardized success response wrapper
        ├── asyncHandler.ts     # Higher-order fn wrapping async route handlers
        └── seedAssignment.ts   # Standalone script to seed assignments into MongoDB
```

---

## 5. Environment Variables

| Variable       | Required | Description                                 | Example                                               |
| -------------- | -------- | ------------------------------------------- | ----------------------------------------------------- |
| `PORT`         | No       | Server port (defaults to `5000`)            | `5000`                                                |
| `MONGODB_URL`  | **Yes**  | MongoDB connection string (without DB name) | `mongodb://localhost:27017`                           |
| `POSTGRES_URL` | **Yes**  | PostgreSQL connection string                | `postgresql://kartikey:pass@localhost:5432/sql-learn` |
| `CORS_ORIGIN`  | No       | Allowed CORS origin(s) for frontend         | `http://localhost:3000`                               |

> `env.ts` throws at startup if `MONGODB_URL` is missing. `POSTGRES_URL` is asserted with `!` (will crash at runtime if absent).

---

## 6. API Documentation

### Health Check

|              |                                       |
| ------------ | ------------------------------------- |
| **Method**   | `GET`                                 |
| **Path**     | `/health`                             |
| **Headers**  | None                                  |
| **Body**     | None                                  |
| **Response** | `{ "status": "API is running fine" }` |

---

### 6.1 Assignments

#### List All Assignments

|             |                    |
| ----------- | ------------------ |
| **Method**  | `GET`              |
| **Path**    | `/api/assignments` |
| **Headers** | None               |
| **Body**    | None               |

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "...",
      "title": "Find High Salary Employees",
      "description": "Easy"
    }
  ],
  "message": "Assignments fetched successfully",
  "success": true
}
```

**Error Responses:**

- `404` — No assignments found
- `500` — Failed to fetch assignments

---

#### Get Assignment by ID

|             |                        |
| ----------- | ---------------------- |
| **Method**  | `GET`                  |
| **Path**    | `/api/assignments/:id` |
| **Headers** | None                   |
| **Body**    | None                   |

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "...",
    "title": "Find High Salary Employees",
    "description": "Easy",
    "question": "List all employees earning more than 50,000",
    "difficulty": "easy",
    "sampleTables": [ ... ],
    "expectedOutput": { "type": "table", "value": [ ... ] },
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Assignment fetched successfully",
  "success": true
}
```

**Error Responses:**

- `400` — Assignment ID is required / Invalid assignment id
- `404` — Assignment not found with the provided id
- `500` — Failed to fetch assignment

---

### 6.2 Sandbox

#### Initialize Sandbox

Creates an isolated PostgreSQL schema for a user-assignment pair. If one already exists, returns the existing metadata.

|             |                                                                  |
| ----------- | ---------------------------------------------------------------- |
| **Method**  | `POST`                                                           |
| **Path**    | `/api/sandbox/init`                                              |
| **Headers** | `X-Identity-ID: <string>` (optional — auto-generated if missing) |
| **Body**    | `{ "assignmentId": "<MongoDB ObjectId string>" }`                |

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "sandboxId": "665a...",
    "schemaName": "sb_guest_abc123_665a...",
    "isNew": true
  },
  "message": "Sandbox initialized successfully",
  "success": true
}
```

**Error Responses:**

- `400` — Assignment ID is required
- `401` — Identity ID is required
- `404` — Assignment not found
- `500` — Failed to create schema / tables / seed data / initialize sandbox

---

#### Execute SQL Query

Runs a user-submitted SQL query inside their sandboxed schema.

|             |                                                                            |
| ----------- | -------------------------------------------------------------------------- |
| **Method**  | `POST`                                                                     |
| **Path**    | `/api/sandbox/execute`                                                     |
| **Headers** | `X-Identity-ID: <string>` (optional — auto-generated if missing)           |
| **Body**    | `{ "assignmentId": "<MongoDB ObjectId string>", "query": "<SQL string>" }` |

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "columns": ["id", "name", "salary", "department"],
    "rows": [
      { "id": 2, "name": "Bob", "salary": 60000, "department": "Engineering" }
    ],
    "rowCount": 1,
    "executionTime": 42
  },
  "message": "Query executed successfully",
  "success": true
}
```

**Error Responses:**

- `400` — Invalid or missing assignmentId / query / Validation errors (empty query, forbidden keyword, multiple statements, invalid syntax) / SQL syntax or runtime errors
- `401` — Identity not found in request
- `403` — Permission denied
- `404` — Sandbox not found (must call `/init` first)
- `408` — Query execution exceeded time limit (5 seconds)
- `500` — Internal error

**Query Validation Rules:**

- Only `SELECT` and `WITH` statements are allowed.
- Multiple statements (separated by `;`) are rejected.
- Blocked keywords: `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP`, `ALTER`, `COPY`, `CALL`, `DO`, `GRANT`, `REVOKE`, `TRUNCATE`, `EXECUTE`, `PREPARE`, `DEALLOCATE`, `DISCARD`, `RESET`.
- Query timeout: **5 seconds** (configurable via `DEFAULT_TIMEOUT`).

---

### Standardized Response Format

All responses follow this structure:

```typescript
// Success
{ statusCode: number, data: T, message: string, success: true }

// Error
{ statusCode: number, data: null, message: string, success: false, errors: any[] }
```

---

## 7. Authentication / Identity Flow

> **This application does NOT use traditional authentication (JWT, OAuth, sessions).**

It uses a lightweight **identity-based tracking** mechanism:

1. Client sends `X-Identity-ID` header with a unique identifier string.
2. `identityMiddleware` reads this header.
3. If the header is **missing**, it generates `guest_{UUID}` and sets `X-Identity-ID` in the response header so the client can persist it.
4. The identity ID is attached to `req.identityId` for downstream use.
5. Sandbox routes (`/api/sandbox/*`) require this middleware; assignment routes do **not**.

The identity is used to scope sandbox schemas — each `(identityId, assignmentId)` pair maps to exactly one PostgreSQL schema.

---

## 8. Database Schema Explanation

### MongoDB Collections

#### `assignments`

Stores SQL learning assignments.

| Field            | Type                   | Description                                    |
| ---------------- | ---------------------- | ---------------------------------------------- |
| `_id`            | ObjectId               | Auto-generated                                 |
| `title`          | String (required)      | Assignment title                               |
| `description`    | String                 | Difficulty label or description                |
| `question`       | String (required)      | The SQL question to solve                      |
| `difficulty`     | Enum: easy/medium/hard | Difficulty level (default: medium)             |
| `sampleTables`   | Array\<Table\>         | Table definitions with columns and sample rows |
| `expectedOutput` | Object `{type, value}` | Expected query result for validation           |
| `createdAt`      | Date (auto)            | Timestamp                                      |
| `updatedAt`      | Date (auto)            | Timestamp                                      |

**Embedded Sub-documents:**

- `Table`: `{ tableName: string, columns: Column[], rows: Mixed[] }`
- `Column`: `{ columnName: string, dataType: string }`
- `ExpectedOutput`: `{ type: string, value: Mixed }`

#### `sandboxmetas`

Tracks which PostgreSQL schema belongs to which user-assignment pair.

| Field          | Type                       | Description            |
| -------------- | -------------------------- | ---------------------- |
| `_id`          | ObjectId                   | Auto-generated         |
| `identityId`   | String (required, indexed) | User identity ID       |
| `assignmentId` | ObjectId (ref: Assignment) | Assignment reference   |
| `schemaName`   | String (required, unique)  | PostgreSQL schema name |
| `lastUsedAt`   | Date                       | Last access timestamp  |
| `createdAt`    | Date (auto)                | Timestamp              |
| `updatedAt`    | Date (auto)                | Timestamp              |

**Indexes:**

- `identityId` (single)
- `assignmentId` (single)
- `(identityId, assignmentId)` compound unique index

### PostgreSQL

No fixed schema — schemas are **dynamically created** at runtime:

- Schema name pattern: `sb_{sanitizedIdentityId}_{sanitizedAssignmentId}` (max 63 chars)
- Each schema contains tables as defined in the assignment's `sampleTables` field
- Tables are populated with the assignment's sample row data
- Users can only run `SELECT`/`WITH` queries — the schema is effectively **read-only** at the application layer

### Relationship Diagram

```
MongoDB                              PostgreSQL
┌──────────────┐                     ┌──────────────────────────────────┐
│ assignments  │                     │  Dynamic Schemas                 │
│  - _id ──────│──┐                  │                                  │
│  - title     │  │                  │  sb_guest_abc_665a... (schema)   │
│  - question  │  │                  │    ├── employees (table)         │
│  - tables[]  │  │                  │    └── departments (table)       │
│  - expected  │  │                  │                                  │
└──────────────┘  │                  │  sb_user_xyz_772b... (schema)    │
                  │                  │    └── orders (table)            │
┌──────────────┐  │                  └──────────────────────────────────┘
│ sandboxmetas │  │
│  - identityId│  │
│  - assignId ─│──┘  (references assignments._id)
│  - schemaName│───── (maps to PostgreSQL schema)
│  - lastUsedAt│
└──────────────┘
```

---

## 9. How to Run Locally

### Prerequisites

- **Node.js** ≥ 18 (or Bun)
- **Docker** & **Docker Compose** (for PostgreSQL)
- **MongoDB** instance (local or Atlas)

### Steps

1. **Clone the repository:**

   ```bash
   git clone <repo-url>
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start PostgreSQL via Docker:**

   ```bash
   docker compose up -d
   ```

   This starts a PostgreSQL instance on port `5432` with:
   - User: `kartikey`
   - Password: `npg_Gd1hR7jebZyJ`
   - Database: `sql-learn`

4. **Create `.env` file in the `backend/` root:**

   ```env
   PORT=5000
   MONGODB_URL=mongodb://localhost:27017
   POSTGRES_URL=postgresql://kartikey:npg_Gd1hR7jebZyJ@localhost:5432/sql-learn
   CORS_ORIGIN=http://localhost:3000
   ```

5. **Seed assignments into MongoDB:**

   ```bash
   npx tsx src/utils/seedAssignment.ts
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:5000`. Verify with:
   ```bash
   curl http://localhost:5000/health
   ```

---

## 10. Known Limitations

| #   | Limitation                         | Details                                                                                                                       |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | **No real authentication**         | Identity is a plain header value — any client can impersonate any user. No token verification exists.                         |
| 2   | **No request validation library**  | Input validation is done manually in controllers. No Zod, Joi, or similar schema validation.                                  |
| 3   | **No rate limiting**               | No middleware to prevent abuse or brute-force query execution.                                                                |
| 4   | **No sandbox cleanup**             | PostgreSQL schemas are created but never dropped. Over time, this will consume significant disk space.                        |
| 5   | **No logging framework**           | Uses `console.log` / `console.error` — no structured logging (Winston, Pino, etc.).                                           |
| 6   | **No query result comparison**     | The `expectedOutput` field exists in assignments but there is no server-side logic to compare user query results against it.  |
| 7   | **Credentials in docker-compose**  | PostgreSQL password is hardcoded in `docker-compose.yaml`.                                                                    |
| 8   | **No Helmet or security headers**  | No `helmet` middleware for HTTP security headers.                                                                             |
| 9   | **CORS_ORIGIN not validated**      | If `CORS_ORIGIN` env var is unset, `cors({ origin: undefined })` may allow all origins depending on the CORS library version. |
| 10  | **Schema name collision risk**     | While sanitized, extremely long identity IDs may produce truncated schema names that collide.                                 |
| 11  | **No pagination**                  | `GET /api/assignments` returns all assignments without pagination.                                                            |
| 12  | **No seed script in package.json** | The seed utility exists but has no corresponding npm script.                                                                  |

---

## 11. Suggested Improvements

### Security

- Add **Helmet** middleware for HTTP security headers.
- Implement **rate limiting** (e.g., `express-rate-limit`) on sandbox and execution endpoints.
- Replace header-based identity with proper **JWT authentication** or at minimum HMAC-signed identity tokens.
- Move Docker credentials to environment variables.
- Add **CORS origin validation** with explicit fallback behavior.

### Reliability

- Add a **sandbox TTL / cleanup job** — a scheduled task (cron or worker) to drop PostgreSQL schemas that haven't been used beyond a threshold (using `lastUsedAt`).
- Implement **connection pool monitoring** and health checks for PostgreSQL.
- Add **request validation** using Zod or Joi at the controller layer.
- Add **structured logging** with Pino or Winston, including request IDs and correlation.

### Features

- Implement **server-side answer validation** — compare query results with `expectedOutput` to tell users if their answer is correct.
- Add **pagination, filtering, and search** for the assignments endpoint.
- Add a `seed` script to `package.json`: `"seed": "tsx src/utils/seedAssignment.ts"`.
- Track **user progress** — store which assignments a user has completed successfully.

### Architecture

- Add a **repository layer** between services and database models for better testability.
- Introduce **unit and integration tests** (Jest/Vitest).
- Add **API versioning** (`/api/v1/...`).
- Consider **connection pooling limits** — the current `pg.Pool` uses defaults, which may not be suitable under load with many dynamic schemas.
- Add **OpenAPI/Swagger** documentation auto-generated from route definitions.
