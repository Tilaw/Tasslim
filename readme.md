# Tasslim Parts Manager

> Inventory, issuance, and operational logistics API for fleet workshop management.

A backend REST API that manages the full lifecycle of motorcycle parts — from supplier purchase through workshop issuance to per-bike tracking — alongside rider gate movements, oil change records, and aggregated reporting. Built for the workshop operations of **Taslim Al Wataniah** (UAE).

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running the Server](#running-the-server)
- [Authentication](#authentication)
- [API Reference](#api-reference)
  - [Resource Groups](#resource-groups)
  - [Transaction Types](#transaction-types)
  - [Batch Transactions & Group Revert](#batch-transactions--group-revert)
  - [Response Envelope](#response-envelope)
  - [Error Handling](#error-handling)
- [Data Model](#data-model)
- [Key Workflows](#key-workflows)
  - [Part Issuance (Job Order)](#part-issuance-job-order)
  - [Stock Replenishment (Purchase)](#stock-replenishment-purchase)
  - [Revert an Issuance](#revert-an-issuance)
  - [Dubai Gate Passing Log](#dubai-gate-passing-log)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The Tasslim Parts Manager API serves as the single source of truth for workshop inventory across the fleet. It handles:

- **Catalog management** — parts, categories, and supplier records
- **Inventory movements** — purchases, issues, sales, returns, and adjustments
- **Atomic batch operations** — issue multiple parts in a single job order with one-shot revert support
- **Fleet data** — bikes, riders, mechanics, and oil change history
- **Operational logs** — manual Dubai gate part entries and rider IN/OUT movements
- **Reporting** — dashboard KPIs and mechanic activity/overtime reports

The API is consumed by the Tasslim workshop management frontend and internal tooling.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Clients                          │
│          (Web App · Mobile · Internal Tools)            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / REST / JSON
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Tasslim Parts Manager API                  │
│                  /api/v1  (JWT auth)                    │
│                                                         │
│  ┌──────────┐  ┌─────────────┐  ┌────────────────────┐ │
│  │  Auth    │  │  Inventory  │  │  Operational Logs  │ │
│  │  Module  │  │  Module     │  │  Module            │ │
│  └──────────┘  └─────────────┘  └────────────────────┘ │
│  ┌──────────┐  ┌─────────────┐  ┌────────────────────┐ │
│  │  Fleet   │  │  Reports    │  │  Migration         │ │
│  │  Module  │  │  Module     │  │  (admin only)      │ │
│  └──────────┘  └─────────────┘  └────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  Database   │
                  │  (Postgres) │
                  └─────────────┘
```

All routes are versioned under `/api/v1`. The `/health` endpoint is unversioned and public.

---

## Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Runtime        | Node.js                                 |
| Framework      | Express.js (assumed) / Fastify          |
| Auth           | JWT (access token + refresh token pair) |
| Database       | PostgreSQL                              |
| ORM            | Prisma / Sequelize                      |
| Validation     | Zod / Joi                               |
| API Spec       | OpenAPI 3.0.3                           |
| Deployment     | Production: `api.taslimalwataniah.ae`   |

> Update this table to reflect the exact packages in `package.json`.

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or `yarn` / `pnpm`)
- **PostgreSQL** >= 14
- Access to a running database instance

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

| Variable               | Required | Description                                      |
|------------------------|----------|--------------------------------------------------|
| `PORT`                 | No       | HTTP port to listen on. Default: `3000`          |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                     |
| `JWT_SECRET`           | Yes      | Secret used to sign access tokens                |
| `JWT_REFRESH_SECRET`   | Yes      | Secret used to sign refresh tokens               |
| `JWT_EXPIRES_IN`       | No       | Access token TTL. Default: `15m`                 |
| `JWT_REFRESH_EXPIRES_IN` | No     | Refresh token TTL. Default: `7d`                 |
| `NODE_ENV`             | No       | `development` \| `production` \| `test`          |

### Installation

```bash
# Clone the repository
git clone https://github.com/taslim/parts-manager.git
cd parts-manager

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# (Optional) Seed reference data
npm run db:seed
```

### Running the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`. Verify with:

```bash
curl http://localhost:3000/health
# → { "status": "ok", "timestamp": "2025-04-01T10:00:00.000Z" }
```

---

## Authentication

The API uses a **JWT Bearer token** scheme with a short-lived access token and a long-lived refresh token.

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@taslimalwataniah.ae",
  "password": "your-password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "<access-token>",
    "refreshToken": "<refresh-token>",
    "user": {
      "id": "uuid",
      "email": "admin@taslimalwataniah.ae",
      "firstName": "Admin",
      "role": "admin"
    }
  }
}
```

### Using the Token

Include the access token in the `Authorization` header on every protected request:

```http
Authorization: Bearer <access-token>
```

### Refreshing Tokens

When the access token expires, exchange the refresh token for a new pair:

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh-token>"
}
```

The old refresh token is **invalidated** on success (rotation).

### Roles

| Role          | Description                                              |
|---------------|----------------------------------------------------------|
| `admin`       | Full access including user management and migration      |
| `manager`     | Full inventory and reporting access; no user admin       |
| `technician`  | Read access + part issuance; no catalog or user changes  |

---

## API Reference

**Base URL:** `https://api.taslimalwataniah.ae`

Full interactive documentation is available in [`docs/api-reference.html`](./docs/api-reference.html).  
The OpenAPI 3.0.3 spec is at [`docs/openapi.json`](./docs/openapi.json).

### Resource Groups

| Group           | Base Path                        | Description                               |
|-----------------|----------------------------------|-------------------------------------------|
| Health          | `/health`                        | Liveness probe                            |
| Auth            | `/api/v1/auth`                   | Login, refresh, user admin                |
| Products        | `/api/v1/products`               | Parts catalog with live stock             |
| Categories      | `/api/v1/categories`             | Product categorisation                    |
| Suppliers       | `/api/v1/suppliers`              | Supplier master data                      |
| Transactions    | `/api/v1/transactions`           | All inventory movements                   |
| Mechanics       | `/api/v1/mechanics`              | Mechanic profiles                         |
| Bikes           | `/api/v1/bikes`                  | Bike master data                          |
| Riders          | `/api/v1/riders`                 | Rider profiles                            |
| Oil Changes     | `/api/v1/oil-changes`            | Per-bike oil change history               |
| Reports         | `/api/v1/reports`                | Dashboard stats and mechanic overtime     |
| Issue Context   | `/api/v1/issue-context`          | Bundled payload for the issuance UI       |
| Passing Logs    | `/api/v1/passing-logs`           | Dubai gate entries and rider movements    |
| Migration       | `/api/v1/migration`              | Legacy data import (admin only)           |

### Transaction Types

Inventory stock is updated exclusively through the `transactions` endpoints. The `quantity` field sign determines direction:

| Type         | Quantity Sign | Stock Effect   | Use Case                              |
|--------------|---------------|----------------|---------------------------------------|
| `purchase`   | Positive      | Increases      | Receiving parts from a supplier       |
| `return`     | Positive      | Increases      | Returned parts back to stock          |
| `issue`      | Negative      | Decreases      | Issuing parts to a mechanic / bike    |
| `sale`       | Negative      | Decreases      | Direct sale (non-workshop)            |
| `adjustment` | Either        | Increases or decreases | Manual stock correction        |

Setting `unitPrice` on a `purchase` transaction updates the product's recorded unit cost.

### Batch Transactions & Group Revert

For job orders that touch multiple parts, use the batch endpoint to commit all lines atomically:

```http
POST /api/v1/transactions/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "transactions": [
    {
      "productId": "uuid-of-part-A",
      "transactionType": "issue",
      "quantity": -1,
      "bikeId": "uuid-of-bike",
      "mechanicId": "uuid-of-mechanic",
      "referenceId": "JO-2025-0042"
    },
    {
      "productId": "uuid-of-part-B",
      "transactionType": "issue",
      "quantity": -2,
      "bikeId": "uuid-of-bike",
      "mechanicId": "uuid-of-mechanic",
      "referenceId": "JO-2025-0042"
    }
  ]
}
```

- Up to **50 lines** per request.
- All lines are committed together — if any line fails validation, **none** are written.
- Use a shared `referenceId` across all lines in a job order.

To **undo an entire job order**, pass its `referenceId` to the group revert endpoint:

```http
DELETE /api/v1/transactions/group/JO-2025-0042
Authorization: Bearer <token>
```

This posts compensating entries (reversed quantity) for each line in the group. Stock is restored; original records are preserved for audit.

### Response Envelope

Every response — success or failure — is wrapped in a consistent envelope:

```jsonc
// Success (2xx)
{
  "success": true,
  "data": { /* ... */ }
}

// Failure (4xx / 5xx)
{
  "success": false,
  "error": {
    "message": "Human-readable description of the error."
  }
}
```

### Error Handling

| HTTP Status | Meaning                                                    |
|-------------|------------------------------------------------------------|
| `400`       | Bad request — malformed JSON or missing required fields    |
| `401`       | Unauthorized — missing or invalid/expired JWT              |
| `403`       | Forbidden — authenticated but insufficient role            |
| `404`       | Not found — resource does not exist                        |
| `422`       | Unprocessable entity — business rule or validation failure |
| `429`       | Too many requests — rate limit exceeded                    |
| `500`       | Internal server error                                      |

---

## Data Model

```
┌──────────┐       ┌────────────┐       ┌──────────────┐
│ Category │──────▶│  Product   │◀──────│   Supplier   │
└──────────┘  1:N  └─────┬──────┘  N:1  └──────────────┘
                         │ 1:N
                         ▼
                  ┌──────────────┐
                  │ Transaction  │
                  │  (movement)  │
                  └──┬─────┬─────┘
                     │     │ N:1
                   N:1     ▼
                     │  ┌──────────┐
                     │  │ Mechanic │
                     │  └──────────┘
                   N:1
                     │
              ┌──────┴──────┐
              │    Bike     │◀──────N:1────┐
              └──────┬──────┘              │
                     │ 1:N           ┌─────┴────┐
                     ▼               │  Rider   │
              ┌──────────────┐       └──────────┘
              │  Oil Change  │
              └──────────────┘

┌───────────────────────┐    ┌─────────────────────┐
│  Dubai Entry (log)    │    │  Rider Movement (log)│
│  bikeNumber · part    │    │  bikeNumber · IN/OUT │
└───────────────────────┘    └─────────────────────┘
```

**Key constraints:**

- A `Product` can only be deleted if it has no linked `Transaction` records.
- A `Category` can only be deleted if no `Product` references it.
- Stock quantity is computed as the sum of all `Transaction.quantity` values for a product — there is no separate stock column.
- `Dubai Entry` and `Rider Movement` records in `passing-logs` are operational logs only; they do not affect inventory stock.

---

## Key Workflows

### Part Issuance (Job Order)

1. Load the issue context bundle (products + mechanics + bikes + riders in one call):
   ```http
   GET /api/v1/issue-context
   ```
2. Build the list of parts to issue.
3. Submit as a batch transaction with a shared `referenceId` (your job order number):
   ```http
   POST /api/v1/transactions/batch
   ```

### Stock Replenishment (Purchase)

1. Confirm the supplier exists — create if not:
   ```http
   GET /api/v1/suppliers
   POST /api/v1/suppliers
   ```
2. Post a `purchase` transaction for each part received. Include `unitPrice` to update the product cost:
   ```http
   POST /api/v1/transactions
   {
     "productId": "...",
     "transactionType": "purchase",
     "quantity": 10,
     "unitPrice": 12.50
   }
   ```

### Revert an Issuance

If a job order was issued in error:

```http
DELETE /api/v1/transactions/group/{referenceId}
```

All lines sharing that `referenceId` receive compensating entries. The original transaction records are retained for full audit trail.

### Dubai Gate Passing Log

Manual part consumption recorded at the Dubai gate — outside the main stock system:

```http
POST /api/v1/passing-logs/dubai-entries
{
  "entries": [
    { "bikeNumber": "DXB-4421", "partName": "Chain Sprocket", "quantity": 1 },
    { "bikeNumber": "DXB-4422", "partName": "Brake Pad",      "quantity": 2 }
  ]
}
```

These records are for logging only and do **not** deduct from product stock.

---

## Project Structure

```
parts-manager/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── suppliers/
│   │   ├── transactions/
│   │   ├── mechanics/
│   │   ├── bikes/
│   │   ├── riders/
│   │   ├── oil-changes/
│   │   ├── reports/
│   │   ├── issue-context/
│   │   ├── passing-logs/
│   │   └── migration/
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   ├── errorHandler.js  # Global error handler
│   │   └── validate.js      # Request validation
│   ├── lib/
│   │   ├── db.js            # Database client
│   │   └── jwt.js           # Token utilities
│   └── app.js               # Express app entry point
├── prisma/                  # (or migrations/)
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   ├── openapi.json         # OpenAPI 3.0.3 spec
│   └── api-reference.html   # Interactive API docs
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

> Module structure follows a feature-first (vertical slice) layout. Each module owns its routes, controller, service, and any module-specific validation.

---

## Scripts

| Script              | Description                                      |
|---------------------|--------------------------------------------------|
| `npm run dev`       | Start development server with hot reload         |
| `npm start`         | Start production server                          |
| `npm test`          | Run all tests                                    |
| `npm run test:unit` | Run unit tests only                              |
| `npm run test:integration` | Run integration tests (requires DB)       |
| `npm run db:migrate`| Run pending database migrations                  |
| `npm run db:seed`   | Seed initial reference data                      |
| `npm run db:reset`  | Drop, recreate, migrate, and seed (dev only)     |
| `npm run lint`      | Run ESLint                                       |
| `npm run lint:fix`  | Run ESLint with auto-fix                         |

---

## Contributing

1. **Branch** from `main` using the convention `feat/`, `fix/`, or `chore/` prefixes:
   ```bash
   git checkout -b feat/add-stock-alerts
   ```
2. **Write tests** for any new endpoint or business logic change.
3. **Update the OpenAPI spec** (`docs/openapi.json`) if you add, change, or remove endpoints.
4. Open a **pull request** against `main`. PRs require at least one review before merging.
5. Squash commits on merge to keep history clean.

**Commit message convention** (Conventional Commits):

```
feat(transactions): add group revert endpoint
fix(auth): handle expired refresh token edge case
chore(deps): upgrade express to 4.19.2
```

---

## License

Proprietary — © Taslim Al Wataniah. All rights reserved.  
Unauthorised copying, distribution, or modification of this software is strictly prohibited.