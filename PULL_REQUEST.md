# Pull Request: Remove localStorage; API-only data and Riders backend module

## Summary

This PR removes all use of **localStorage** as a cache or source of truth for domain data across the frontend. All pages now read from **in-memory state** hydrated by backend APIs on login (`App.loadData()`), and all mutations (create/update/delete/import) go through the **correct API endpoints**. A new **Riders** backend module (table, service, controller, routes) is added so rider master data is persisted in the database and consumed via `/api/v1/riders`.

---

## 1. Core app: no localStorage for data; session in sessionStorage

### `frontend/js/app.js`

- **In-memory state:** Introduced `App.state` (`inventory`, `suppliers`, `mechanics`, `bikes`, `sales`, `oilChanges`). No domain data is written to localStorage.
- **loadData():** When the user has a valid session, it calls `/products`, `/mechanics`, `/bikes`, `/suppliers`, `/transactions`, `/oil-changes` and **only** updates `App.state`. Removed all localStorage writes and local/offline fallbacks.
- **Session:** Auth token and user are stored in **sessionStorage** (per-tab) via `_setSession()` / `getCurrentUser()`. Removed localStorage for `SESSION`, `DB_MIGRATED`, and login-attempt/lockout (lockout now uses sessionStorage).
- **Getters:** `App.getInventory()`, `getSuppliers()`, `getMechanics()`, `getBikes()`, `getSales()`, `getOilChanges()` return slices of `App.state`.
- **Login:** Backend-only; removed local user list and offline login fallback.
- **exportToDatabase():** No-op with a message that data already lives in the central database.

---

## 2. Frontend pages: use `App.get*()` and APIs only

### Bikes (`frontend/bikes.html`)

- **loadData():** `this.data = App.getBikes()` (no localStorage).
- **saveBike():** Always calls `POST /bikes` or `PATCH /bikes/:id`, then `App.loadData()` and `loadData()`.
- **delete():** Always calls `DELETE /bikes/:id`, then refreshes from server.
- **Excel import:** Each row is sent with `App.apiCall('/bikes', 'POST', bike)`; duplicates are skipped; then `App.loadData()` and local refresh. No local-only import path.

### Inventory (`frontend/inventory.html`, `frontend/js/inventory.page.js`)

- All references to `localStorage.getItem(App.KEYS.SALES)` replaced with `App.getSales()` for report/aggregation data.

### Reports (`frontend/reports.html`)

- **init() / syncData():** Use `App.getSales()`, `App.getInventory()`, `App.getMechanics()`, `App.getBikes()`.
- **deleteTransaction():** Only the API path remains: `DELETE /transactions/group/:id`, then `App.loadData()` and `syncData()`. Removed local revert and localStorage writes.
- **generateInvoiceFromBuilder():** Removed `isMigrated` and the entire local-only branch. Technician issues are created only via `/transactions/batch` (or single `/transactions` fallback), then `App.loadData()`, `syncData()`, and `generate()`.

### Dashboard, POS, Purchase Order, Mechanics, Users, Bike History, Riders, Mechanic History, Settings, Diagnostic

- **Dashboard:** Uses `App.getInventory()`, `App.getSales()`, `App.getSuppliers()`; migration banner removed.
- **POS / Purchase order:** Inventory loaded with `App.getInventory()`.
- **Mechanics:** Uses `App.getMechanics()`; save/delete/Excel import use `/mechanics` API only.
- **Users:** Load/save/delete use `/auth` and `/auth/register`, `/auth/:id` PATCH/DELETE only; no local user list.
- **Bike history:** Bikes, mappings (derived from `App.getSales()`), and oil changes from `App.getBikes()` and `App.getOilChanges()`.
- **Riders:** Now fully backed by the new Riders API (see below).
- **Mechanic history:** Uses `App.getSales()`, `App.getMechanics()`, `App.getInventory()`; legacy mappings removed.
- **Settings:** Migration status always “Cloud Mode”; clear cache only resets `App.state` and reloads; profile save uses PATCH to auth API and `App._setSession()`.
- **Diagnostic:** Reads from `App.state` / getters; sample data and import/clear no longer write to localStorage.

---

## 3. New Riders backend module (DB + API)

### Database

- **Table `riders`** (in `backend/src/database/migrations.ts`):
  - `id` (VARCHAR 36, PK),
  - `name`, `phone`, `plates` (TEXT, comma-separated bike plates),
  - `imported` (TINYINT, for “Delete All Imported”),
  - `created_at`, `updated_at`.

### API

- **Routes** (`backend/src/modules/riders/riders.routes.ts`):
  - `GET /api/v1/riders` — list all riders
  - `GET /api/v1/riders/:id` — get one rider
  - `POST /api/v1/riders` — create (body: `name`, `phone`, `plates`, optional `imported`)
  - `PATCH /api/v1/riders/:id` — update
  - `DELETE /api/v1/riders/imported/all` — delete all imported riders (must be registered before `/:id`)
  - `DELETE /api/v1/riders/:id` — delete one rider

- **Service** (`riders.service.ts`): CRUD + `deleteAllImported()`.
- **Controller** (`riders.controller.ts`): Handlers for the above routes.
- **App:** Riders routes mounted at `/api/v1/riders` in `backend/src/app.ts`.

### Riders frontend (`frontend/riders.html`)

- **loadData():** Fetches riders with `App.apiCall('/riders', 'GET')` and sets `this.riders`; mappings and oil changes still from `App.getSales()` and `App.getOilChanges()`.
- **saveRider():** Creates with `POST /riders` or updates with `PATCH /riders/:id`, then reloads riders and re-renders.
- **deleteRider():** `DELETE /riders/:id`, then reload and re-render.
- **handleExcel():** For each row, `POST /riders` with `{ name, phone, plates, imported: true }`, then reload riders.
- **deleteAllImported():** `DELETE /riders/imported/all`, then reload and re-render.
- Edit/Report/Delete buttons use string IDs (UUID) safely in `onclick`.

---

## 4. Other fixes (from previous work)

- **Reports – single workshop consumption print:** Bike number (plate) is included in the printed invoice header.
- **Overtime:** UI shows “Logout Time” (last transaction time) as the main metric; backend unchanged (first/last transaction times).

---

## 5. What’s no longer used

- **localStorage** for: inventory, sales, mechanics, bikes, suppliers, oil changes, mappings, users, riders, DB_MIGRATED. Session and language/sidebar preferences use **sessionStorage** only where needed.
- **Offline / local-only** code paths for bikes, mechanics, users, and reports (technician issue builder and delete).
- **Riders** in-memory only or `riders_info` in localStorage; all rider data is now in the DB and accessed via `/api/v1/riders`.

---

## 6. How to test

1. **Backend:** Run migrations (so `riders` table exists), start API server.
2. **Login:** Use backend credentials; confirm no localStorage usage for domain data (only sessionStorage for token).
3. **Bikes / Mechanics / Users:** Add, edit, delete, and (where applicable) Excel import; confirm changes persist and reload from server.
4. **Reports:** Generate technician issue from builder; delete a transaction; confirm data comes from API and print includes bike number where applicable.
5. **Riders:** Add, edit, delete riders; import Excel; “Delete All Imported”; confirm list loads from `GET /riders` and all mutations hit the new riders API.
6. **Dashboard, POS, Inventory, Bike history, Mechanic history:** Confirm they show data from `App.get*()` after login (no localStorage for domain data).

---

## 7. Files changed (high level)

- **Frontend:** `app.js`, `bikes.html`, `inventory.html`, `inventory.page.js`, `reports.html`, `dashboard.html`, `pos.html`, `purchase-order.html`, `mechanics.html`, `users.html`, `bike-history.html`, `riders.html`, `mechanic-history.html`, `settings.html`, `diagnostic.html`.
- **Backend:** `migrations.ts`, `app.ts`, new `modules/riders/` (service, controller, routes).
- **Docs:** `PULL_REQUEST.md` (this file).
