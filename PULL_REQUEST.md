# Pull Request: Issues/Transactions consistency, revert fix, dashboard alignment & issue-part performance

## Summary

This PR fixes inconsistent issue counts across devices, ensures deleted issues are fully reverted in the database, aligns the dashboard with the transactions API and issue-part page, and optimizes the issue-part page for faster loading (especially on mobile).

---

## Issues addressed

### 1. Dashboard not using the right API for issues

- **Problem:** The dashboard was not consistently using the transactions API for “issues” data. Different devices showed different issue counts.
- **Why:** The dashboard (and other pages) relied on `localStorage` (`spi_sales`) for issue-related stats. That cache could be stale, device-specific, or include reverted issues.
- **Fix:** The dashboard now loads issue totals only from the backend via `GET /transactions?type=issue`. It no longer derives issue counts from `localStorage`. On init it sets `issuedTotals = {}`, then awaits `syncIssueTotalsFromServer()` so the first meaningful paint uses server data.

### 2. Inconsistency of issue counts across devices/accounts

- **Problem:** Different devices or accounts saw different numbers for “Total Issued” and related metrics.
- **Why:** Each device had its own `localStorage` snapshot of “sales” (including issue groups). Sync timing and revert behavior differed, so counts diverged.
- **Fix:** Issue counts on the dashboard are now read only from `GET /transactions?type=issue`. All devices see the same source of truth. When the API returns 0 issues or the request fails, the dashboard shows 0 instead of stale or inflated values.

### 3. Duplicate issue creation (one action creating multiple records)

- **Problem:** Some devices sometimes created duplicate issue records for a single user action (e.g. double-tap or retry).
- **Why:** No idempotency on the server and no guard against double-submit in the UI.
- **Fix:**
  - **Backend:** Before inserting a transaction, the create handler checks for an existing non-reverted row with the same `reference_id`, `product_id`, and `transaction_type`. If found, it returns success without inserting or updating inventory (idempotent no-op).
  - **Frontend:** The “Confirm Issuance” button is disabled and shows a loading state while the request is in progress (`_isSubmitting`), and re-enabled only in `finally`, preventing double submissions.

### 4. Deleted issues still present in the database

- **Problem:** When a user “deleted” (reverted) an issue, it could still appear in the DB or in listings.
- **Why:** For groups **without** `reference_id` (e.g. legacy data), the UI sent a single transaction `id`. The backend reverted only that one row; other rows in the same logical group (same `created_at` + `mechanic_id`) were left active.
- **Fix:** In `revertGroup`, when the request is handled as a single-transaction id:
  - If that row has a `reference_id`, the backend now reverts **all** rows with that `reference_id`.
  - If it has no `reference_id`, it finds all “sibling” rows (same `created_at`, `mechanic_id`, `transaction_type = 'issue'`) and reverts **all** of them.
  - Revert is applied by updating a set of row ids (`id IN (...)`), so the whole group is marked `is_reverted = 1` and inventory is corrected for each line.

### 5. Dashboard not matching issue-part page and DB (and not showing 0 when appropriate)

- **Problem:** The dashboard could show non-zero issue counts when the issue-part page and DB showed 0, or keep showing old counts after issues were reverted.
- **Why:** Issue stats were partly or fully derived from `localStorage` and were not reset on API failure or empty response.
- **Fix:** The dashboard uses only the transactions API for issue metrics. On success it builds `issuedTotals` from the response and re-renders. If the response is missing/invalid or the request throws, it sets `issuedTotals = {}` and re-renders so “Total Issued” and the flow grid show 0.

### 6. Issue-part page slow on mobile

- **Problem:** The issue-part page felt slow on mobile due to multiple network round-trips and unnecessary work.
- **Why:** The page made four separate API calls (products, mechanics, bikes, transactions) on load and on every poll, and submitted each issued part with a separate POST. Polling ran at a fixed interval even when the tab was hidden.
- **Fix:**
  - **Single bootstrap endpoint:** New `GET /api/v1/issue-context` returns in one response `{ products, mechanics, bikes, transactions }` (transactions limited to 250 issue rows). The frontend prefers this; if the endpoint is missing (e.g. old backend), it falls back to four parallel calls and uses `limit=250` for transactions.
  - **Batch create:** New `POST /api/v1/transactions/batch` accepts `{ transactions: [...] }` (max 50) and creates all lines in one DB transaction. The issue-part page uses this when creating an issuance with one or more parts; on 404 or error it falls back to one-by-one POSTs.
  - **Smarter polling:** Polling uses the Page Visibility API: when the tab is hidden, the timer is cleared; when it becomes visible again, one immediate load runs and the interval is restarted. On mobile the interval is 45s; on desktop 20s. History is re-rendered only when the fetched data actually changed (simple fingerprint of `sales.length` and first id), reducing DOM updates.

---

## Changes by area

### Backend

- **`transactions.service.ts`**
  - `getAll`: Added optional `limit` query support (capped at 500) for smaller payloads.
  - `create`: Idempotency check: if a non-reverted row exists for the same `reference_id` + `product_id` + `transaction_type`, return without inserting.
  - `createBatch`: New method to insert multiple transaction lines (and apply inventory deltas) in a single DB transaction; duplicate check per item when `referenceId` is present.
  - `revertGroup`: When matching by single transaction id, revert the full group (by `reference_id` or by siblings with same `created_at` + `mechanic_id`); mark reverted by list of ids.
- **`transactions.controller.ts`**
  - New `createBatch` action: reads `req.body.transactions` and calls `TransactionService.createBatch`.
- **`transactions.routes.ts`**
  - New `POST /batch` route with validation.
- **`transactions.validation.ts`**
  - Extracted shared transaction item schema (including optional rider fields); added `createBatchTransactionsSchema` for `body.transactions` (array, 1–50 items).
- **New module `issue-context`**
  - `GET /api/v1/issue-context`: Aggregates products (all), mechanics (all), bikes (all), and issue transactions (type=issue, limit=250) in one response. Uses existing services in parallel.

### Frontend

- **`dashboard.html`**
  - Issue totals come only from the API. Init sets `issuedTotals = {}`, then awaits `syncIssueTotalsFromServer()`.
  - `syncIssueTotalsFromServer`: On non-success or non-array response, or on catch, sets `issuedTotals = {}` and re-renders so the dashboard shows 0 when there are no issues or when the request fails.
- **`issue-part.html`**
  - **Load:** Prefers `GET /issue-context`; on failure or missing endpoint, uses `Promise.all` of GET products, mechanics, bikes, and `GET /transactions?type=issue&limit=250`. Shared logic for mapping transactions into `sales` moved to `_applyTransactions`.
  - **Submit:** Builds a single payload array and calls `POST /transactions/batch`; on failure, falls back to one POST per part.
  - **Polling:** Visibility-based: stop timer when tab hidden, run one load + restart timer when visible. Mobile poll interval 45s, desktop 20s. Re-render history only when a simple fingerprint of `sales` (length + first id) changes.

---

## Testing suggestions

- **Dashboard vs issue-part:** With 0 issues in DB, dashboard shows 0 for Total Issued and flow grid; create issues on one device, confirm dashboard and issue-part match; revert an issue, confirm both drop to the same count and dashboard can show 0.
- **Revert whole group:** Create an issue with multiple parts (with `reference_id`). Revert it from the UI; confirm all related rows are `is_reverted = 1` and no longer returned by `GET /transactions?type=issue`.
- **Duplicate submit:** Rapid double-click “Confirm Issuance”; only one set of records should be created (idempotency and button guard).
- **Issue-part performance:** On a slow connection or mobile, confirm first load uses one request when backend supports `/issue-context`, and that creating an issuance with several parts uses one batch request when `/transactions/batch` is available.
- **Old backend:** With a backend that does not have `/issue-context` or `/transactions/batch`, issue-part page still loads (fallback to 4 calls and single POSTs) and behavior remains correct.

---

## API additions (backward compatible)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/issue-context` | Returns `{ products, mechanics, bikes, transactions }` for the issue-part page (transactions limited to 250 issue rows). |
| POST | `/api/v1/transactions/batch` | Body: `{ transactions: [ {...}, ... ] }`. Creates up to 50 transaction lines in one DB transaction. Same validation as single create per item. |

Existing endpoints are unchanged; frontend falls back when these are not available.
