# Tasslim API Reference

REST API for the Tasslim Parts Manager workshop system: inventory, part issuance, bikes, mechanics, riders, oil changes, gate logs, and reports.

| | |
|---|---|
| **Base path** | `/api/v1` |
| **Local** | `http://localhost:4000/api/v1` |
| **Production** | `https://api.taslimalwataniah.ae/api/v1` |
| **OpenAPI spec** | `GET /api/openapi.json` |
| **Interactive docs** | `GET /api/docs` (Swagger UI) |
| **Health** | `GET /health` |

---

## Authentication

Most endpoints require a JWT bearer token.

```http
Authorization: Bearer <access_token>
```

| Endpoint | Auth |
|----------|------|
| `POST /api/v1/auth/login` | Public |
| `POST /api/v1/auth/refresh` | Public |
| `GET /health` | Public |
| `GET /api/openapi.json` | Public |
| All other `/api/v1/*` routes | JWT required |

**Login**

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "admin@taslimalwataniah.ae", "password": "..." }
```

**Response**

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "refreshToken": "<refresh>",
    "user": { "id": "...", "email": "...", "firstName": "...", "lastName": "...", "role": "admin" }
  }
}
```

**Refresh**

```http
POST /api/v1/auth/refresh
{ "refreshToken": "<refresh>" }
```

### Roles

Role-gated endpoints accept one or more of:

`super_admin` · `admin` · `store_manager` · `inventory_manager` · `staff` · `sales_person` · `accountant` · `viewer`

When a route lists required roles, the user's JWT role must match one of them.

---

## Response envelope

**Success**

```json
{ "success": true, "data": { ... } }
```

**Paginated success** (transactions)

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "nextCursor": "<opaque>",
    "hasMore": true,
    "total": 5123
  }
}
```

`meta.total` is only present when `includeTotal=true` on group queries.

**Error**

```json
{ "success": false, "error": { "message": "..." } }
```

| Status | Meaning |
|--------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden (role) |
| 404 | Not found |
| 422 | Validation error |

---

## Pagination (transactions)

List endpoints use **keyset (cursor) pagination** — not offset-based — for scale.

1. First request: omit `cursor`
2. Read `meta.nextCursor` from the response
3. Next page: pass `cursor=<value>`
4. Stop when `meta.hasMore` is `false`

| Endpoint | Default `limit` | Max `limit` |
|----------|-----------------|-------------|
| `GET /transactions` | 200 | 1000 |
| `GET /transactions/groups` | 50 | 200 |

### Shared query filters (transactions)

| Parameter | Description |
|-----------|-------------|
| `type` | `purchase` \| `sale` \| `return` \| `adjustment` \| `issue` |
| `productId` | Product UUID |
| `productName` | Exact product name |
| `mechanicId` | Mechanic UUID |
| `mechanicName` | Exact mechanic name |
| `bikeId` | Bike UUID |
| `bikePlate` | Exact plate number |
| `startDate` | `YYYY-MM-DD` (inclusive) |
| `endDate` | `YYYY-MM-DD` (inclusive) |
| `limit` | Page size |
| `cursor` | Opaque cursor from `meta.nextCursor` |
| `includeTotal` | `true` — include `meta.total` (groups only) |

---

## Endpoint index

### Health & meta

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Liveness probe |
| GET | `/api/openapi.json` | No | OpenAPI 3.0 JSON spec |
| GET | `/api/docs` | No | Swagger UI |

### Auth — `/api/v1/auth`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/login` | Public | Login, get JWT |
| POST | `/refresh` | Public | Refresh tokens |
| POST | `/register` | admin, super_admin | Create user |
| GET | `/` | admin, super_admin | List users |
| PATCH | `/:id` | Self or admin | Update user email/password |
| DELETE | `/:id` | admin, super_admin | Delete user |

### Products — `/api/v1/products`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | Any authenticated | List all products (with stock) |
| GET | `/:id` | Any authenticated | Get product by ID |
| POST | `/` | super_admin, store_manager, inventory_manager | Create product |
| PATCH | `/:id` | super_admin, store_manager, inventory_manager | Update product |
| DELETE | `/:id` | super_admin, store_manager | Delete product |

### Categories — `/api/v1/categories`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | Any authenticated | List categories |
| POST | `/` | super_admin, store_manager | Create category |
| PATCH | `/:id` | super_admin, store_manager | Update category |
| DELETE | `/:id` | super_admin, store_manager | Delete category |

### Suppliers — `/api/v1/suppliers`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | Any authenticated | List suppliers |
| POST | `/` | admin, super_admin, store_manager, inventory_manager, staff | Create supplier |
| PATCH | `/:id` | admin, super_admin, store_manager, inventory_manager, staff | Update supplier |
| DELETE | `/:id` | admin, super_admin, store_manager, inventory_manager, staff | Delete supplier |

### Transactions — `/api/v1/transactions`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | Any authenticated | List transaction **lines** (paginated) |
| GET | `/groups` | Any authenticated | List transaction **groups** (paginated, preferred for history) |
| GET | `/groups/summary` | Any authenticated | Aggregate counts (groups, lines, parts) |
| GET | `/summary/products` | Any authenticated | Per-product quantity aggregates |
| POST | `/` | admin, staff, managers | Create single transaction line |
| POST | `/batch` | admin, staff, managers | Create up to 50 lines atomically |
| DELETE | `/group/:referenceId` | admin, staff, managers | Revert issuance group, restore stock |

**Transaction types**

| Type | Stock effect |
|------|--------------|
| `purchase` | Adds stock |
| `return` | Adds stock |
| `sale` | Deducts stock |
| `issue` | Deducts stock (workshop part issuance) |
| `adjustment` | +/- depending on sign |

**Create line** `POST /transactions`

```json
{
  "productId": "uuid",
  "transactionType": "issue",
  "quantity": -1,
  "mechanicId": "uuid",
  "bikeId": "uuid",
  "referenceId": "ISS-ABC123",
  "date": "2025-03-03T10:00:00.000Z",
  "riderName": "Ahmed",
  "riderPhone": "+971...",
  "riderId": "RDR-001",
  "receiverName": "Khalid",
  "unitPrice": 12.50,
  "notes": "..."
}
```

**Batch create** `POST /transactions/batch`

```json
{
  "transactions": [ { ... }, { ... } ]
}
```

All lines in one issuance should share the same `referenceId`.

**Group response shape** (`GET /transactions/groups`)

```json
{
  "id": "ISS-ABC123",
  "referenceId": "ISS-ABC123",
  "date": "2025-03-03T10:00:00.000Z",
  "type": "issue",
  "mechanic": "Khalid",
  "bike": "DXB-4421",
  "riderName": "Ahmed",
  "items": [
    { "productId": "uuid", "name": "Air Filter", "sku": "AF-001", "qty": 1 }
  ]
}
```

### Mechanics — `/api/v1/mechanics`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | Any authenticated | List mechanics |
| GET | `/:id` | Any authenticated | Get mechanic |
| POST | `/` | Any authenticated | Create mechanic |
| PATCH | `/:id` | Any authenticated | Update mechanic |
| DELETE | `/:id` | super_admin, store_manager | Delete mechanic |

### Bikes — `/api/v1/bikes`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | Any authenticated | List bikes |
| GET | `/:id` | Any authenticated | Get bike |
| POST | `/` | Any authenticated | Create bike |
| PATCH | `/:id` | Any authenticated | Update bike |
| DELETE | `/:id` | super_admin, store_manager | Delete bike |

### Riders — `/api/v1/riders`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | Any authenticated | List riders |
| GET | `/:id` | Any authenticated | Get rider |
| POST | `/` | Any authenticated | Create rider |
| PATCH | `/:id` | Any authenticated | Update rider |
| DELETE | `/:id` | Any authenticated | Delete rider |
| DELETE | `/imported/all` | Any authenticated | Delete all migration-imported riders |

### Oil changes — `/api/v1/oil-changes`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | Any authenticated | List oil changes |
| POST | `/` | admin, staff, managers | Record oil change |

**Query params (GET):** `bikeId`, `mechanicId`, `limit` (max 500)

### Reports — `/api/v1/reports`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/dashboard-stats` | admin, managers | Dashboard aggregate stats |
| GET | `/mechanic-overtime` | admin, staff, managers | Mechanic activity for a date |

**Mechanic overtime query:** `date` (`YYYY-MM-DD`), `mechanicId`

### Issue context — `/api/v1/issue-context`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | Any authenticated | Bootstrap bundle for issue-part page |

Returns `{ products, mechanics, bikes }`. History is loaded via `GET /transactions/groups`.

### Passing logs — `/api/v1/passing-logs`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/dubai-entries` | Any authenticated | List Dubai manual part entries |
| POST | `/dubai-entries` | admin, staff, managers | Create Dubai entries (max 50 lines) |
| GET | `/rider-movements` | Any authenticated | List gate IN/OUT movements |
| POST | `/rider-movements` | admin, staff, managers | Record gate movement |

**Dubai entry POST body**

```json
{
  "entries": [
    { "bikeNumber": "DXB-123", "partName": "Chain", "quantity": 1 }
  ]
}
```

**Rider movement POST body**

```json
{
  "bikeNumber": "DXB-123",
  "date": "2025-03-03",
  "time": "09:30",
  "direction": "IN",
  "riderName": "Ahmed",
  "phone": "+971...",
  "city": "Dubai",
  "company": "..."
}
```

`direction` must be `IN` or `OUT`.

### Migration — `/api/v1/migration`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/import` | admin, super_admin | One-shot legacy data import |

---

## Client usage patterns

| Page / feature | Recommended endpoints |
|----------------|----------------------|
| Issue Part — catalog | `GET /issue-context` |
| Issue Part — history | `GET /transactions/groups?type=issue` (+ cursor) |
| Reports | `GET /transactions/groups` + `/groups/summary` |
| Dashboard issued totals | `GET /transactions/summary/products?type=issue` |
| Bike history | `GET /transactions/groups?type=issue&bikePlate=...` |
| Mechanic history | `GET /transactions/groups?type=issue&mechanicName=...` |
| Rider report | `GET /transactions/groups?type=issue&bikePlate=...` per plate |
| Inventory item report | `GET /transactions/summary/products?type=issue&productId=...` |
| Create issuance | `POST /transactions/batch` |
| Revert issuance | `DELETE /transactions/group/:referenceId` |

---

## Swagger UI

When the server is running, open:

- Local: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- Production: [https://api.taslimalwataniah.ae/api/docs](https://api.taslimalwataniah.ae/api/docs)

Use **Authorize** and paste `Bearer <token>` to test protected routes interactively.
