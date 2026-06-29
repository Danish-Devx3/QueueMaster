# QueueMaster

> **Technical Assignment Submission** — a customer waiting-queue manager for small businesses
> (clinics, barber shops, repair desks), built as a time-boxed (~1 hour) full-stack exercise.

The business owner can add customers, move them through **Waiting → Being Served → Completed**,
and remove them — with the queue updating **live across every open tab/device** over
**Server-Sent Events (SSE)**.

🔗 **Repository:** https://github.com/Danish-Devx3/QueueMaster

---

## 📋 The Assignment

Build a small but production-minded queue manager. The business owner must be able to:

1. Add a customer to the queue
2. Mark a customer as **Being Served**
3. Mark a customer as **Completed**
4. Remove a customer from the queue
5. View the current list of waiting customers

> **What's being evaluated:** *how I think* — not feature count. So this README spends most of its
> words on **design decisions and trade-offs**. See [Design Decisions](#-design-decisions--how-this-maps-to-the-evaluation-criteria).

**Required stack:** React + TypeScript + Tailwind (frontend), Node/Express + TypeScript (backend),
in-memory storage, and Docker (two containers) orchestrated with Docker Compose.

---

## ✨ What's Built

- ➕ **Add / 🔄 Serve / ✅ Complete / 🗑️ Remove** customers, with a two-step inline confirm on remove.
- 👀 **Live queue view** grouped into *Being Served → Waiting → Completed*, with per-customer
  position and time-in-queue.
- ⚡ **Real-time sync over Server-Sent Events** — every change is pushed to all connected screens
  instantly, with a **Live/Offline** indicator and automatic resync on reconnect.
- 📊 **At-a-glance stats** (waiting / being served / completed counts).
- 🧯 **Graceful error handling** end-to-end: normalized API errors, a dismissible UI error banner,
  loading skeletons, empty states, and per-action button states.

---

## 🧱 Tech Stack

| Layer        | Technology                                              |
| ------------ | ------------------------------------------------------- |
| Frontend     | React + TypeScript, Tailwind CSS, Vite, native `EventSource` |
| Backend      | Express + TypeScript                                    |
| Runtime / PM | [Bun](https://bun.sh) — runs the TypeScript backend directly (no compile step) and is the package manager for both apps |
| Storage      | In-memory (`Map`) — see [Trade-offs](#-trade-offs--compromises-1-hour-box) |
| Realtime     | Server-Sent Events (SSE) — zero realtime dependencies   |
| Deployment   | Docker (two containers) + Docker Compose; nginx serves the frontend |

---

## 🚀 Running the Application

### Option A — Docker (recommended, zero local setup)

> **Prerequisite:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
> and running. You do **not** need Node, Bun, or anything else installed locally.

1. Open a terminal in the project root (the folder with `docker-compose.yml`).
2. Build and start both containers:
   ```bash
   docker compose up --build
   ```
   *(On older Docker installs: `docker-compose up --build`.)*
3. Wait for the backend log: `API + SSE listening on http://localhost:4000`.
4. Open the app:
   ```
   http://localhost:3000
   ```
5. **Try it:** add a customer → **Serve** → **Complete** → **Remove**.
6. **See the real-time sync:** open `http://localhost:3000` in a **second tab** (or another
   device on your network). Act in one tab and watch the other update **instantly** — no refresh.
   The header shows a green **Live** badge while connected.
7. Stop:
   ```bash
   docker compose down
   ```

> **Ports:** app on **`:3000`**, API on **`:4000`**. If a port is taken, change the host side of
> the `ports` mapping in `docker-compose.yml` (e.g. `"3001:80"`); if you change the frontend port,
> also update `CORS_ORIGIN` (backend env) and `VITE_API_URL` (frontend build arg) to match.

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

The frontend defaults to `http://localhost:4000` for the API; override via `frontend/.env`
(`VITE_API_URL`). Type-check the backend with `cd backend && bun run typecheck`; the frontend's
`bun run build` type-checks as part of the production build.

---

## 🧠 Design Decisions — How this maps to the evaluation criteria

| Criterion | Decision |
| --------- | -------- |
| **Folder structure** | Backend split into **routes → controllers → services**, with `realtime/`, `middleware/`, `types/`, `utils/`, `config/`. Frontend split into `components/` (presentational), `hooks/` (state), `services/` (REST + stream), `lib/`, `types/`. Each layer has one job. |
| **API design** | Clean, resource-oriented REST around `/api/queue` (`GET`/`POST`/`PATCH`/`DELETE`), correct status codes (201/200/204/400/404), and a single consistent error envelope. See [API Reference](#-api-reference). |
| **State management** | A single **`useQueue` custom hook** owns *all* state and networking — no Redux, no prop-drilled setters. Components stay dumb/presentational. |
| **Realtime architecture** | **REST for commands, SSE for push.** The realtime traffic is one-directional (server → client), so SSE is the right-sized tool — no WebSocket upgrade, no realtime library, and `EventSource` gives reconnection for free. After any mutation the server pushes the **full queue**; clients just replace local state with each snapshot. The server is the single source of truth, so there's no fragile client-side merge/optimistic logic and every tab converges. Because the server re-sends a snapshot on every (re)connection, reconnects self-heal automatically. |
| **Error handling** | Backend: validation middleware + a central error handler producing `{ error: { message, code } }`; async handlers wrapped so nothing crashes the process. Frontend: a `fetch` wrapper normalizes network/HTTP/parse failures into friendly messages surfaced via a dismissible banner; loading skeletons and empty states cover every UI state. |
| **Code quality** | Strict TypeScript (`strict`, `noUnusedLocals`, etc.) on both sides, consistent naming, small single-purpose modules, and explanatory comments on the *why* (not the *what*). |
| **UI** | Deliberately simple and clean: status sections, live connection badge, stats, time-in-queue, two-step remove confirm, per-action loading — all with Tailwind, no UI kit. |

### Realtime data flow

```
┌──────────────────────────────┐         ┌────────────────────────────────────┐
│  Frontend (nginx :3000)       │         │  Backend (Express :4000)             │
│                               │         │                                      │
│  React + useQueue hook        │         │  routes → controllers → services     │
│   ├─ REST: commands ──────────┼────────▶│   GET/POST/PATCH/DELETE /api/queue   │
│   │   (add/serve/complete/del)│         │        │                             │
│   └─ SSE: live updates ◀──────┼─────────┼─ GET /api/queue/stream               │
│       EventSource             │         │   push "queue:updated" (full queue)  │
│       (queue:updated)         │         │        ▲ on connect + after mutation │
└──────────────────────────────┘         │   In-memory Map<id, Customer>        │
                                          └────────────────────────────────────┘
```

The in-memory store lives behind a pure `QueueService`, so swapping it for a real database later
touches nothing else (controllers, realtime and UI stay identical).

### Why SSE over WebSocket?

The realtime channel here is **one-directional** — the server pushes queue updates, and every
client → server action already goes over REST. That's exactly what SSE is for, so it's the
better-fit choice:

- **No extra dependency** — native `EventSource` in the browser + a plain `text/event-stream`
  response on the server (removing `socket.io` / `socket.io-client` shrank the frontend bundle by
  ~13 KB gzipped).
- **Reconnection for free** — `EventSource` retries automatically, and since the server sends a
  full snapshot on each connection, clients self-heal with zero extra code.
- **Plays nicely with HTTP infra** — it's just HTTP, so proxies/CDNs need no upgrade handling.

WebSocket would be the right call if the app grew **bidirectional** needs (live collaboration,
presence, typing) — noted in [If I Had Another 3 Hours](#-if-i-had-another-3-hours).

---

## 🗂️ Project Structure

```
QueueMaster/
├── backend/
│   ├── src/
│   │   ├── server.ts              # composition root: app + SSE keep-alive + graceful shutdown
│   │   ├── app.ts                 # Express app (cors, json, logging, routes, error handling)
│   │   ├── config/env.ts          # typed env config with safe defaults
│   │   ├── routes/                # RESTful route definitions (incl. /stream)
│   │   ├── controllers/           # request/response orchestration + broadcast
│   │   ├── services/              # in-memory store + business rules (pure, swappable)
│   │   ├── realtime/              # SSE hub: holds open streams + broadcasts events
│   │   ├── middleware/            # validation, request logging, central error handler
│   │   ├── types/                 # shared domain types
│   │   └── utils/                 # AppError, asyncHandler
│   ├── Dockerfile                 # oven/bun image, runs TS directly
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # app shell (header + stats + form + list)
│   │   ├── components/            # AddCustomerForm, QueueList, QueueSection, CustomerItem,
│   │   │                          # QueueStats, ConnectionStatus, StatusBadge, EmptyState, …
│   │   ├── hooks/                 # useQueue (state + networking), useNow (ticker)
│   │   ├── services/              # api.ts (REST) + stream.ts (SSE / EventSource)
│   │   ├── lib/                   # constants, time formatting
│   │   └── types/                 # domain types (mirror of backend)
│   ├── nginx.conf                 # SPA fallback
│   ├── Dockerfile                 # bun build → nginx serve
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Reference

Base URL: `http://localhost:4000`

| Method   | Endpoint           | Body                       | Success         | Description                              |
| -------- | ------------------ | -------------------------- | --------------- | ---------------------------------------- |
| `GET`    | `/api/health`        | —                        | `200 OK`        | Liveness → `{ "status": "ok", "uptime": 12 }` |
| `GET`    | `/api/queue`         | —                        | `200 OK`        | List all customers (FIFO). `?status=` filter optional |
| `GET`    | `/api/queue/stream`  | —                        | `200 OK` (stream) | **SSE** `text/event-stream` of live queue updates |
| `POST`   | `/api/queue`         | `{ "name", "phone?" }`   | `201 Created`   | Add a customer (status defaults to `waiting`) |
| `PATCH`  | `/api/queue/:id`     | `{ "status" }`           | `200 OK`        | Update status (`waiting`/`serving`/`completed`) |
| `DELETE` | `/api/queue/:id`     | —                        | `204 No Content`| Remove a customer                        |

**Realtime:** `GET /api/queue/stream` is a Server-Sent Events endpoint. It emits a named
`queue:updated` event whose `data` is the full queue (JSON) — once on connect, then after every
mutation. Inspect it directly with:

```bash
curl -N http://localhost:4000/api/queue/stream
# event: queue:updated
# data: [ { "id": "…", "name": "Ada Lovelace", "status": "waiting", … } ]
```

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

## 📐 Assumptions

- **FIFO queue.** Customers are ordered by creation time (oldest first); the *Waiting* section
  shows a 1-based position. No priority/VIP concept.
- **Unique IDs, not unique names.** Each customer gets a UUID, so duplicate names (two "John"s)
  are fine and unambiguous.
- **Single business / single operator.** No multi-tenancy or per-user accounts — the app
  represents one shop's queue, for the owner/front desk.
- **Status lifecycle:** `waiting → serving → completed`. The API permits any transition for
  flexibility; the UI surfaces the natural forward steps.
- **Completed customers are kept as session history** (separate section) until removed, rather
  than auto-deleted.
- **Empty states are first-class** — every section and the whole queue show a friendly placeholder.
- **In-memory state resets on restart** (see Trade-offs).

---

## ⚖️ Trade-offs / Compromises (1-hour box)

Deliberate choices to fit the time budget — each a conscious trade-off, not an oversight:

- **In-memory storage instead of a database.** Fast to build and run, but **data is lost on
  restart** and won't scale beyond one backend instance. Isolated behind one swappable service.
- **Hand-rolled validation** instead of a schema library (Zod) — adequate for this small surface,
  but not yet shared with the frontend.
- **No authentication** — assumes a single trusted operator.
- **No automated tests** committed — verified manually (steps below); the seams (pure service,
  app/server split) are designed to be test-friendly.
- **Types duplicated** between frontend and backend rather than extracted into a shared package.

---

## ⏳ If I Had Another 3 Hours

In rough priority order:

1. **Persistent database (PostgreSQL + Prisma).** Swap the in-memory `Map` for a real store — the
   pure `QueueService` is already the seam; only its internals change.
2. **Shared Zod schemas.** Define request/response schemas once, reuse on API + frontend with
   inferred types — one source of truth for shape *and* validation.
3. **Automated tests.** Unit (`QueueService`), integration (routes via supertest), component (RTL).
4. **Auth & multi-tenancy.** JWT login so multiple businesses each manage an isolated queue.
5. **Optimistic UI updates** with rollback, for extra snappiness on slow links (the SSE broadcast
   already keeps everyone consistent).
6. **WebSocket upgrade — only if it's warranted.** SSE is the right fit for today's one-way flow.
   If the product grows **bidirectional** needs (multi-staff live collaboration, presence/"who's
   viewing", typing indicators), I'd switch the realtime layer to WebSocket. The seam is small:
   the `SseHub` would become a socket hub, and `services/stream.ts` would swap `EventSource` for a
   socket client — controllers and UI stay the same.
7. **Ops polish.** Docker healthchecks (`depends_on: condition: service_healthy`), structured
   logging, rate limiting, metrics (avg wait time, served/day), and CI (lint + typecheck + test + build).

---

## ✅ Manual Verification

This build was verified end-to-end:

- Backend type-checks and runs natively under Bun; REST endpoints, validation (400) and 404s return
  correct shapes.
- Frontend production build succeeds.
- `docker compose up --build` → backend health `{ "status": "ok" }`, add-customer works, frontend
  served (HTTP 200), the SSE stream emits the initial snapshot and pushes `queue:updated` on
  mutation, and the CORS preflight returns 204.
- Two-tab test confirms live updates and the Live/Offline indicator.
