# Bitbeat

Bitbeat is a full-stack music streaming platform built with a distributed microservices architecture. Users can register, upload music, manage playlists, and stream audio.

---

## Architecture Overview

### High-Level Architecture

```text
Client (Browser)
    ↓
Nginx :80  ← single entry point
    ├── /api/*         → Gateway :3000
    └── /*             → Frontend :80

Gateway :3000
    ├── → Auth Service     :3001  (HTTP)
    ├── → Songs Service    :3002  (HTTP)
    ├── → Streaming        :3003  (HTTP)
    └── → Playlists        :3004  (HTTP)

Auth Service :3001
    ├── → MongoDB           (data)
    └── → RabbitMQ          (events: user.created)

Songs Service :3002
    ├── → MongoDB           (metadata)
    ├── → Docker Volume     (audio files: write)
    └── → RabbitMQ          (events)

Streaming Service :3003
    └── → Docker Volume     (audio files: read-only)

Playlists Service :3004
    ├── → MongoDB           (data)
    └── → RabbitMQ          (subscribes to: user.created)
```

---

## Full System Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT                                        │
│                          React + Vite (Browser)                                 │
└───────────────────────────────────┬─────────────────────────────────────────────┘
                                    │ HTTP :80
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  NGINX                                          │
│                            Reverse Proxy :80                                    │
│                                                                                 │
│   /api/stream/*  ──── proxy_buffering: off ────────────────────────────┐        │
│   /api/*         ──── standard proxy ──────────────────────────┐       │        │
│   /*             ──── frontend:80                              │       │        │
└────────────────────────────────────────────────────────────────┼───────┼────────┘
                                                                 │       │
                                                                 ▼       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY :3000                                  │
│                           TypeScript / Express 5                                │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Bootstrap (index.ts)                            │   │
│  │  Object.values(controller).forEach(endpoint =>                          │   │
│  │    app[method](route, parseHttpRequest → handler → res.json)            │   │
│  │  )                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │  gateway.core.ts │  │  http-auth.ts    │  │  gateway.middleware.ts       │  │
│  │                  │  │                  │  │                              │  │
│  │  ApiHandler<T,R> │  │  HttpCreateUser  │  │  parseHttpRequest()          │  │
│  │  ApiHandler      │  │  Request/Schema  │  │  withoutAuthentication()     │  │
│  │  HandlerContext  │  │  Response/Schema │  │  buildServerErrorResponse()  │  │
│  │  HttpRequestMsg  │  │  HttpAuthService │  │                              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────────┘  │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                                    │
│  │ user.gateway.ts  │  │  auth.controller │                                    │
│  │                  │  │                  │                                    │
│  │ UserService      │  │  userGateway     │                                    │
│  │ Factory type     │  │  Controller(     │                                    │
│  │                  │  │   factory)       │                                    │
│  └──────────────────┘  └──────────────────┘                                    │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         HTTP Clients (clients/)                          │  │
│  │   authServiceClient()  ──── fetch ────→  http://auth:3001                │  │
│  │   songsServiceClient() ──── fetch ────→  http://songs:3002               │  │
│  │   streamClient()       ──── fetch ────→  http://streaming:3003           │  │
│  │   playlistsClient()    ──── fetch ────→  http://playlists:3004           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└────────┬──────────────────┬────────────────────┬──────────────────┬────────────┘
         │                  │                    │                  │
         ▼                  ▼                    ▼                  ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────┐  ┌──────────────────┐
│ AUTH SERVICE │  │  SONGS SERVICE   │  │  STREAMING  │  │    PLAYLISTS     │
│   :3001      │  │     :3002        │  │   SERVICE   │  │    SERVICE       │
│              │  │                  │  │    :3003    │  │     :3004        │
│  TypeScript  │  │   Rust / Actix   │  │             │  │  TypeScript      │
│  Express 5   │  │                  │  │ Rust / Actix│  │  Express 5       │
│              │  │                  │  │             │  │                  │
│  db.ts       │  │  multipart       │  │ actix-files │  │  (planned)       │
│  userRepo    │  │  upload handler  │  │ Range reqs  │  │  playlist CRUD   │
│  userService │  │  metadata store  │  │ zero-buffer │  │  event consumer  │
│  authRouter  │  │  event publisher │  │             │  │                  │
└──────┬───────┘  └────────┬─────────┘  └──────┬──────┘  └───────┬──────────┘
       │                   │                   │                  │
       │ insertOne         │ insertOne         │ read             │
       │                   │                   │                  │
       ▼                   ▼                   ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               MONGODB :27017                                    │
│                                                                                 │
│   ┌──────────────┐      ┌──────────────────┐        ┌──────────────────────┐   │
│   │   auth_db    │      │    songs_db       │        │    playlists_db      │   │
│   │              │      │                  │        │                      │   │
│   │  users       │      │  songs           │        │  playlists           │   │
│   │  ─────────   │      │  ──────────      │        │  ─────────────       │   │
│   │  id          │      │  id              │        │  id                  │   │
│   │  name        │      │  title           │        │  name                │   │
│   │  lastName    │      │  filePath        │        │  userId              │   │
│   │  email       │      │  duration        │        │  songs[]             │   │
│   │  password    │      │  uploadedBy      │        │                      │   │
│   │  (hashed)    │      │                  │        │                      │   │
│   └──────────────┘      └──────────────────┘        └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

       │                   │                                        │
       │ publish           │ publish                    subscribe   │
       ▼                   ▼                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             RABBITMQ :5672                                      │
│                                                                                 │
│   ┌───────────────────────────────────────────────────────────────────────┐    │
│   │                    Exchange: user.created  (fanout, durable)          │    │
│   │                                                                       │    │
│   │   Auth publishes: { id, name, email }                                 │    │
│   │                         │                                             │    │
│   │              ┌──────────┴──────────┐                                 │    │
│   │              ▼                     ▼                                  │    │
│   │        playlists queue       future services                         │    │
│   └───────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│   ┌───────────────────────────────────────────────────────────────────────┐    │
│   │                    Exchange: song.uploaded  (fanout, durable)         │    │
│   │                                                                       │    │
│   │   Songs publishes: { id, title, uploadedBy }                          │    │
│   └───────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘

       │ write             │ write              │ read
       ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DOCKER VOLUME: audio_data                              │
│                              /data/audio                                        │
│                                                                                 │
│          songs service writes ──────────────────── streaming service reads     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## User Registration Flow

```text
Browser
  │
  │  POST /api/create-user
  │  { name, lastName, email, password }
  ▼
Nginx :80
  │
  │  proxy_pass gateway:3000
  ▼
Gateway :3000
  │
  │  1. parseHttpRequest(HttpCreateUserRequest$Schema)(req)
  │     → Zod validates { method, route, headers, payload, ... }
  │
  │  2. handler(parsed.data, { correlationId, requestorIp })
  │
  │  3. authServiceClient().createUser(msg.payload)
  │     → fetch POST http://auth:3001/api/users
  ▼
Auth Service :3001
  │
  │  4. hashingHelper.hashPassword(password, SALT_ROUNDS)
  │     → bcrypt hash
  │
  │  5. repository.createUser({ name, lastName, email, hashedPassword })
  │     → MongoDB insertOne → returns { id }
  │
  │  6. publisher.publishUserCreated({ id, name, email })
  │     → RabbitMQ fanout exchange "user.created"
  │
  │  7. return { id, name, lastName, email }
  ▼
Gateway :3000
  │
  │  8. result.type === "success"
  │     → res.status(201).json(result.data)
  ▼
Browser
  │
  ← { id, name, lastName, email }
```

---

## Audio Streaming Flow

```text
Browser (Audio Player)
  │
  │  GET /api/stream/:songId
  │  Header: Range: bytes=0-
  ▼
Nginx :80
  │  proxy_buffering: off  ← critical: bytes flow directly to client
  │  forwards Range header
  ▼
Gateway :3000
  │  routes to streaming service
  ▼
Streaming Service :3003  (Rust / Actix)
  │
  │  actix-files serves /data/audio/:songId
  │  HTTP 206 Partial Content
  │  Content-Range: bytes 0-X/total
  │
  └─── reads from Docker Volume: audio_data (/data/audio)

Browser receives chunks as they arrive (no buffering)
Player can seek → new Range request → streaming resumes from offset
```

---

## Docker Compose Startup Order

```text
         ┌──────────┐     ┌───────────────────────┐
         │  mongo   │     │  rabbitmq             │
         │  :27017  │     │  :5672 / :15672       │
         └────┬─────┘     └──────────┬────────────┘
              │                      │ health check:
              │                      │ rabbitmq-diagnostics ping
              │                      │ (interval: 10s, retries: 5)
              │                      │
    ┌─────────┼──────────────────────┼─────────────────┐
    │         │                      │                 │
    ▼         ▼                      ▼                 ▼
┌────────┐ ┌──────────────┐  ┌─────────────┐  ┌──────────────┐
│  auth  │ │    songs     │  │  streaming  │  │  playlists   │
│ :3001  │ │    :3002     │  │    :3003    │  │    :3004     │
│        │ │ depends_on:  │  │             │  │ depends_on:  │
│depends │ │ mongo        │  │             │  │ mongo        │
│_on:    │ │ rabbitmq     │  │             │  │ rabbitmq     │
│ mongo  │ │ (healthy)    │  │             │  │ (healthy)    │
└───┬────┘ └──────┬───────┘  └──────┬──────┘  └──────┬───────┘
    │             │                 │                 │
    └─────────────┴────────┬────────┴─────────────────┘
                           │ all backend services ready
                           ▼
                     ┌──────────┐
                     │ gateway  │
                     │  :3000   │
                     │depends on│
                     │all above │
                     └────┬─────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
        ┌──────────┐           ┌──────────┐
        │ frontend │           │  nginx   │
        │   :80    │           │   :80    │
        └──────────┘           └──────────┘
```

---

## Services

### API Gateway (`services/gateway/` — TypeScript/Node.js) — Port 3000

Single entry point for all client requests. Validates via Zod schemas and delegates to downstream services via HTTP.

| Layer | Location | Purpose |
| --- | --- | --- |
| Base types | `services/gateway.core.ts` | `ApiHandler`, `HttpRequestMessage`, `ApiHandlerResponse`, `HandlerContext` |
| HTTP types + schemas | `types/http-auth.ts` | Request/response types + Zod schemas per endpoint |
| Middleware | `middleware/gateway.middleware.ts` | `withoutAuthentication`, `parseHttpRequest`, `buildServerErrorResponse` |
| Service contracts | `services/user.gateway.ts` | `UserServiceFactory` type |
| HTTP clients | `clients/gateway.client.ts` | `authServiceClient` — wraps fetch calls to Auth |
| Controllers | `controllers/auth.controller.ts` | Factory functions returning endpoint objects |
| Bootstrap | `index.ts` | Wires factories, iterates `Object.values(controller)`, registers Express routes |

### Auth Service (`services/auth/` — TypeScript/Node.js) — Port 3001

Handles user registration, password hashing, and user creation events.

| Layer | Location | Purpose |
| --- | --- | --- |
| DB connection | `db.ts` | `dbRegistry.connect(url, dbName)` → MongoDB `Db` |
| Models | `models/user.ts` | `UserModel<T>` — name, lastName, email, password |
| Repository | `repositories/user.repository.ts` | `userRepository(collection)` → CRUD on MongoDB |
| Service | `services/auth.service.ts` | `userService(repo, publisher)` — business logic |
| Events | `events/publisher.ts` | `createEventPublisher(amqpUrl)` → RabbitMQ publisher |
| Routes | `routes/auth.routes.ts` | `authRouter(service)` → Express Router |
| Bootstrap | `index.ts` | DB → repo → publisher → service → routes → listen |

### Songs Service (`services/songs/` — Rust/Actix-web) — Port 3002

High-performance audio file upload and metadata management. Saves files to Docker volume, stores metadata in MongoDB, publishes events to RabbitMQ.

### Streaming Service (`services/streaming/` — Rust/Actix-web) — Port 3003

Zero-overhead audio streaming with HTTP Range request support. Read-only access to the audio Docker volume. No database dependency.

### Playlists Service (`services/playlists/` — TypeScript/Node.js) — Port 3004

Playlist CRUD operations. Subscribes to `user.created` RabbitMQ events. MongoDB for storage.

---

## Shared Package (`packages/shared/` — `@bitbeat/shared`)

```text
packages/shared/
│
├── src/hash/hashing.ts
│     hashingHelper.hashPassword()   ←── used by Auth Service
│     hashingHelper.comparePassword()
│     SALT_ROUNDS = 10
│
└── src/types/responses.ts
      SuccessResponse<T>             ←── used by Auth Repository
      ErrorResponse                  ←── used by Auth Repository + Gateway
```

Referenced by services via:

```json
"@bitbeat/shared": "file:../../packages/shared"
```

---

## Messaging — RabbitMQ

| Exchange | Type | Publisher | Subscribers | Payload |
| --- | --- | --- | --- | --- |
| `user.created` | fanout | Auth Service | Playlists Service | `{ id, name, email }` |
| `song.uploaded` | fanout | Songs Service | future services | `{ id, title, uploadedBy }` |

Messages are durable and persistent — survive RabbitMQ restarts.

---

## Database — MongoDB

| Database | Service | Collections |
| --- | --- | --- |
| `auth_db` | Auth | `users` |
| `songs_db` | Songs | `songs` |
| `playlists_db` | Playlists | `playlists` |

---

## Development

**Local dev (no Docker):**

```bash
docker compose up mongo rabbitmq -d
npm run watch:dev
```

**Full Docker:**

```bash
npm run start:dev   # docker compose up --build
npm run stop:dev    # docker compose down
```

**Format all services:**

```bash
npm run format
```

Environment variables: see `env.example`

---

## Key Architectural Decisions

| Decision | Rationale |
| --- | --- |
| API Gateway pattern | Single entry point, centralised validation and error handling |
| Rust for Songs + Streaming | High-performance I/O — audio uploads and byte-range streaming benefit from zero-cost abstractions |
| TypeScript for Auth, Gateway, Playlists | Faster iteration on business logic, strong type safety |
| RabbitMQ Fanout | Decouples Auth from downstream services — new subscribers require no Auth changes |
| `@bitbeat/shared` local package | Avoids code duplication for hashing and response types across services |
| tsx watch mode | No build step in development — instant reload on TypeScript changes |
| Multi-stage Docker builds | Lean production images — only compiled output, no dev tools |
| `proxy_buffering off` for streams | Nginx must not buffer audio responses — clients need bytes as they arrive |
