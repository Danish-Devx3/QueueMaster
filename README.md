# QueueMaster

A simple, real-time **customer waiting-queue manager** for small businesses (clinics, barber
shops, repair desks). The business owner can add customers, move them through
**Waiting → Being Served → Completed**, and remove them — with the queue updating **live across
every open tab/device** via WebSockets.

> Built as a 1-hour technical assignment. The goal is to demonstrate **engineering judgement** —
> clean architecture, a RESTful API, simple-but-effective state management and graceful error
> handling — over feature count.

---

## ✨ Features

- ➕ **Add** a customer to the queue (name + optional phone).
- 🔄 Mark a customer as **Being Served**.
- ✅ Mark a customer as **Completed**.
- 🗑️ **Remove** a customer from the queue.
- 👀 **View** the live queue, grouped into *Being Served*, *Waiting* and *Completed* sections.
- ⚡ **Real-time sync** — every action is broadcast over WebSockets, so all connected screens
  stay in sync instantly (no refresh needed).

---

## 🧱 Tech Stack

| Layer        | Technology                                              |
| ------------ | ------------------------------------------------------- |
| Frontend     | React + TypeScript, Tailwind CSS, Vite, socket.io-client |
| Backend      | Express + TypeScript, Socket.IO                         |
| Runtime / PM | [Bun](https://bun.sh) — runs the TypeScript backend directly (no compile step) and is the package manager for both apps |
| Storage      | In-memory (`Map`) — see [Compromises](#-compromises)    |
| Realtime     | WebSockets (Socket.IO)                                  |
| Deployment   | Docker (two containers) + Docker Compose; nginx serves the frontend |

---

## 🏗️ Architecture

```
┌──────────────────────────────┐         ┌────────────────────────────────────┐
│  Frontend (nginx :3000)       │         │  Backend (Express + Socket.IO :4000) │
│                               │         │                                      │
│  React + useQueue hook        │         │  routes → controllers → services     │
│   ├─ REST: commands ──────────┼────────▶│   GET/POST/PATCH/DELETE /api/queue   │
│   │   (add/serve/complete/del)│         │        │                             │
│   └─ WebSocket: live updates ◀┼─────────┼─ emit "queue:updated" (full queue)   │
│       (queue:updated)         │         │        ▲ after every mutation        │
└──────────────────────────────┘         │   In-memory Map<id, Customer>        │
                                          └────────────────────────────────────┘
```

**Core principle — REST for commands, WebSocket for push.**
The client sends **commands** over REST (the operations are simple request/response). After any
successful mutation, the server **broadcasts the entire updated queue** over Socket.IO. The
backend is the single source of truth, so the client just replaces its local state with each
snapshot — there's no fragile client-side merge/optimistic logic, and every tab converges on the
same state.

### Folder structure

```
QueueMaster/
├── backend/
│   ├── src/
│   │   ├── server.ts              # composition root: HTTP + Socket.IO + listen
│   │   ├── app.ts                 # Express app (cors, json, routes, error handling)
│   │   ├── config/env.ts          # typed env config with safe defaults
│   │   ├── routes/                # RESTful route definitions
│   │   ├── controllers/           # request/response orchestration + broadcast
│   │   ├── services/              # in-memory store + business rules (pure)
│   │   ├── sockets/               # Socket.IO setup + broadcast helper
│   │   ├── middleware/            # input validation + central error handler
│   │   ├── types/                 # shared domain types
│   │   └── utils/                 # AppError, asyncHandler
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # app shell
│   │   ├── components/            # AddCustomerForm, QueueList, QueueSection, CustomerItem, …
│   │   ├── hooks/useQueue.ts      # single owner of state + networking
│   │   ├── services/              # api.ts (REST) + socket.ts (WebSocket)
│   │   ├── types/                 # domain types (mirror of backend)
│   │   └── lib/constants.ts       # status config, section order, API base URL
│   ├── nginx.conf                 # SPA fallback
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

The backend separates **routes → controllers → services** so the HTTP layer, orchestration and
business logic each have one job. The service is pure and storage-agnostic, so swapping the
in-memory `Map` for a database later touches nothing else. On the frontend, all state and
networking live in one `useQueue` hook; components stay presentational.

---

## 🔌 API Reference

Base URL: `http://localhost:4000`

| Method   | Endpoint           | Body                       | Success         | Description                              |
| -------- | ------------------ | -------------------------- | --------------- | ---------------------------------------- |
| `GET`    | `/api/health`      | —                          | `200 OK`        | Liveness check → `{ "status": "ok" }`    |
| `GET`    | `/api/queue`       | —                          | `200 OK`        | List all customers (FIFO). `?status=` filter optional |
| `POST`   | `/api/queue`       | `{ "name", "phone?" }`     | `201 Created`   | Add a customer (status defaults to `waiting`) |
| `PATCH`  | `/api/queue/:id`   | `{ "status" }`             | `200 OK`        | Update status (`waiting`/`serving`/`completed`) |
| `DELETE` | `/api/queue/:id`   | —                          | `204 No Content`| Remove a customer                        |

**Customer shape**

```json
{
  "id": "f1c2…",
  "name": "Ada Lovelace",
  "phone": "555-0100",
  "status": "waiting",
  "createdAt": "2026-06-29T10:00:00.000Z",
  "updatedAt": "2026-06-29T10:00:00.000Z"
}
```

**Error shape** (consistent across all endpoints)

```json
{ "error": { "message": "Customer name is required.", "code": "INVALID_NAME" } }
```

**Example**

```bash
curl -X POST http://localhost:4000/api/queue \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","phone":"555-0100"}'
```

---

## 🚀 Running the Application

### Option A — Docker (recommended, zero local setup)

> **Prerequisite:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
> and running. That's it — you do **not** need Node.js installed locally.

1. Open a terminal in the project root (the folder containing `docker-compose.yml`).
2. Build and start both containers:
   ```bash
   docker compose up --build
   ```
   *(On older Docker installs, use `docker-compose up --build`.)*
3. Wait until you see the backend log: `API + WebSocket listening on http://localhost:4000`.
4. Open your browser at:
   ```
   http://localhost:3000
   ```
5. **Try it out:**
   - Add a customer → it appears under **Waiting**.
   - Click **Serve** → it moves to **Being Served**.
   - Click **Complete** → it moves to **Completed**.
   - Click **Remove** → it disappears.
6. **See the real-time magic:** open `http://localhost:3000` in a **second browser tab** (or
   another device on your network). Add or serve a customer in one tab and watch the other update
   **instantly** — no refresh.
7. To stop:
   ```bash
   docker compose down
   ```

> **Ports:** the app is on **`:3000`**, the API on **`:4000`**. If either is taken on your
> machine, change the host side of the `ports` mapping in `docker-compose.yml` (e.g.
> `"3001:80"`). If you change the frontend port, also update `CORS_ORIGIN` (backend env) and
> `VITE_API_URL` (frontend build arg) to match.

### Option B — Local development (hot reload)

> **Prerequisite:** [Bun](https://bun.sh) 1.x (`curl -fsSL https://bun.sh/install | bash`).

```bash
# Terminal 1 — backend (Bun runs the TypeScript directly, with --watch reload)
cd backend
bun install
bun run dev        # http://localhost:4000

# Terminal 2 — frontend
cd frontend
bun install
bun run dev        # http://localhost:3000
```

The frontend defaults to `http://localhost:4000` for the API. To override, create
`frontend/.env` from `.env.example` and set `VITE_API_URL`.

> **Type checking:** `cd backend && bun run typecheck` (runs `tsc --noEmit`). The frontend's
> `bun run build` type-checks as part of the production build.

---

## 📐 Assumptions

- **FIFO queue.** Customers are ordered by creation time (oldest first); the *Waiting* section
  shows a 1-based position. There is no priority/VIP concept.
- **Unique IDs, not unique names.** Each customer gets a UUID, so duplicate names (two "John"s)
  are perfectly fine and unambiguous.
- **Single business / single screen owner.** No multi-tenancy or per-user accounts — the app
  represents one shop's queue, intended for the owner/front desk.
- **Status lifecycle:** `waiting → serving → completed`. The API permits any transition (e.g.
  moving a customer back to *waiting*) for flexibility; the UI surfaces the natural forward steps.
- **Completed customers are kept as history** within the current session (shown in a separate
  section) until removed, rather than auto-deleted.
- **Empty states are first-class.** Each section and the whole queue render a friendly placeholder
  when empty.
- **In-memory state resets on restart.** Data lives only while the backend process runs (see
  Compromises).

---

## ⏳ If I Had Another 3 Hours

In rough priority order:

1. **Persistent database (PostgreSQL + Prisma).** Replace the in-memory `Map` with a real store
   so data survives restarts. The pure `QueueService` is already the seam — only its internals
   would change.
2. **Shared schema validation with Zod.** Define request/response schemas once and reuse them on
   both the API (replacing the hand-rolled validators) and the frontend, with inferred types — a
   single source of truth for shape *and* validation.
3. **Automated tests.** Unit tests for `QueueService`, integration tests for the API routes
   (Jest + supertest) and component tests for the UI (React Testing Library).
4. **Authentication & multi-tenancy.** JWT-based login so multiple businesses can each manage
   their own isolated queue.
5. **Optimistic UI updates.** Reflect actions instantly with rollback on failure, for an even
   snappier feel on slow connections (the WebSocket broadcast already keeps everyone consistent).
6. **Operational polish.** Health checks/`depends_on: condition: service_healthy` in Compose,
   structured logging, request rate limiting, pagination/metrics (average wait time, served/day),
   and a CI pipeline (lint + typecheck + test + build).

> **Note:** Real-time updates via **WebSockets are already implemented** in this build (they were
> originally on this "future work" list), which is why they don't appear above.

---

## ⚖️ Compromises

Made deliberately to fit the 1-hour scope — each is a conscious trade-off, not an oversight:

- **In-memory storage instead of a database.** Fast to build and run, but **data is lost on
  restart** and won't scale beyond a single backend instance. The architecture isolates this in
  one swappable service.
- **Hand-rolled validation** instead of a schema library (Zod) — adequate for the small surface,
  but not shared with the frontend.
- **No authentication.** The app assumes a trusted single operator.
- **No automated tests** committed (manual verification steps provided above).
- **Types duplicated** between frontend and backend rather than extracted into a shared package.
- **Config via env defaults** rather than a fully validated config system.
