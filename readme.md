# Tasslim (Parts Manager)

Single-repo workshop management system:

- **Frontend**: static HTML/CSS/JS under `frontend/`
- **Backend**: Node.js + Express + TypeScript API under `backend/`
- **Database**: **MySQL** (via `mysql2`), migrated automatically on server startup

The frontend talks to the backend over REST (`/api/v1/*`) using JWT auth, and the backend also serves the frontend as static files.

---

## Overview

This system supports workshop operations for fleet maintenance:

- **Inventory**: products (parts), categories, suppliers
- **Transactions**: purchases/issues/adjustments and other inventory movements
- **People/Fleet**: mechanics, bikes, riders
- **Maintenance**: oil change records
- **Operational logs**: passing logs (including Dubai-related logs)
- **Reports**: dashboard/report endpoints
- **Admin/auth**: login/refresh + user management endpoints

---

## How it runs

When you start the backend (`backend/src/server.ts`):

- It runs DB migrations (`backend/src/database/migrations.ts`)
- It verifies the MySQL connection (`backend/src/database/db.ts`)
- It starts the HTTP server (default port **4000**)

The backend serves:

- **Health**: `GET /health` (public)
- **Swagger UI**: `GET /api/docs`
- **OpenAPI JSON**: `GET /api/openapi.json`
- **API**: `/api/v1/*`
- **Frontend**: static files from the repo root (so `frontend/*.html` loads when hosted by the backend)

---

## Tech stack (actual)

- **Runtime**: Node.js
- **Backend**: Express (v5), TypeScript
- **DB**: MySQL (`mysql2/promise`)
- **Auth**: JWT access + refresh tokens (`jsonwebtoken`)
- **Hashing**: `bcryptjs`
- **Validation**: `zod`
- **Docs**: Swagger UI (`swagger-ui-express`)

---

## Quick start (Windows)

### Prerequisites

- Node.js (recommended: **18+**)
- MySQL server available (local or remote)

### Backend setup

1) Configure env in `backend/.env`:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `PORT` (default **4000**)
- `JWT_SECRET`

2) Install + run:

```powershell
cd backend
npm install
npm run dev
```

Verify:

- `http://localhost:4000/health`
- `http://localhost:4000/api/docs`

### Frontend usage

The frontend’s API base URL is computed in `frontend/js/config.js`:

- When opened via `file://` or `localhost`: defaults to `http://localhost:4000/api/v1`
- Production fallback: `https://api.taslimalwataniah.ae/api/v1`
- Optional override: `window.ENV_CONFIG.API_BASE_URL`

Recommended during development: run the backend and open:

- `http://localhost:4000/frontend/index.html`

---

## Authentication

- **Login**: `POST /api/v1/auth/login`
- **Refresh**: `POST /api/v1/auth/refresh`
- Protected requests use: `Authorization: Bearer <token>`

---

## Settings page endpoints

`frontend/settings.html` uses:

- **Health check**: `GET /health` (public)
- **Update account credentials**: `PATCH /api/v1/auth/:id` (JWT required)

Request body:

```json
{
  "email": "new-username-or-email",
  "currentPassword": "required when changing your own password",
  "password": "new password (min 6 chars)"
}
```

Rules:

- A user can update **their own** account (`:id` matches JWT user id)
- `admin/super_admin` can update any user
- Self-service password change requires correct `currentPassword`

---

## Backend API modules

Mounted in `backend/src/app.ts`:

- `/api/v1/auth`
- `/api/v1/products`
- `/api/v1/categories`
- `/api/v1/suppliers`
- `/api/v1/transactions`
- `/api/v1/mechanics`
- `/api/v1/bikes`
- `/api/v1/riders`
- `/api/v1/oil-changes`
- `/api/v1/reports`
- `/api/v1/issue-context`
- `/api/v1/passing-logs`
- `/api/v1/migration`

---

## Project structure (actual)

```
Tasslim/
├── frontend/
│   ├── *.html
│   ├── css/
│   └── js/
│       ├── config.js
│       └── app.js
├── backend/
│   ├── package.json
│   ├── .env
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── database/
│   │   │   ├── db.ts
│   │   │   └── migrations.ts
│   │   ├── middleware/
│   │   └── modules/
│   │       ├── auth/
│   │       ├── products/
│   │       ├── categories/
│   │       ├── suppliers/
│   │       ├── transactions/
│   │       ├── mechanics/
│   │       ├── bikes/
│   │       ├── riders/
│   │       ├── oil-changes/
│   │       ├── reports/
│   │       ├── issue-context/
│   │       ├── passing-logs/
│   │       └── system/   (migration)
│   └── dist/            (compiled output)
└── README.md
```

---

## Backend scripts

From `backend/`:

- `npm run dev`: run TS in watch mode
- `npm run build`: compile to `backend/dist/`
- `npm start`: run compiled server

---

## License

Proprietary — © Taslim Al Wataniah. All rights reserved.

