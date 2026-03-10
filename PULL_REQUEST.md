# Pull Request: Centralized inventory updates for purchase restock, POS sales, and technician issues

## Summary

This PR removes device-only `localStorage` as a source of truth for stock movements. Restocks from the purchase page, sales from the POS, and technician issue actions from the reports page now all go through the backend transactions API so the dashboard, inventory, reports, and all devices stay consistent.

---

## Issues addressed

### 1. Purchase restock / POS sales not reflected on dashboard and inventory

- **Problem:** After restocking items on the purchase page or completing a sale in the POS, stock changes appeared on that device only and were lost on reload. The dashboard and inventory page, which read from the backend, did not reflect these changes, leading to inconsistent stock across pages and devices.
- **Why:** `purchase-order.html` and `pos.html` directly mutated `App.KEYS.INVENTORY` (and, in POS, `App.KEYS.SALES`) in `localStorage` without creating corresponding records in the `inventory_transactions` table. The backend remained unaware of these movements, so any view sourced from the API stayed stale.
- **Fix (high level):** Both flows were moved to use the existing transactions API (`/transactions` and `/transactions/batch`) as the single source of truth, and then refresh the cached inventory snapshot via `App.loadData()` so all frontend pages stay in sync with the database.

### 2. Reports page issuing/deleting technician issues only in localStorage

- **Problem:** On `reports.html`, the “Technician Issue” builder and delete actions adjusted inventory and “issue” records only in `localStorage` (`spi_inventory`, `spi_sales`, and `spi_mappings`). The backend inventory and `inventory_transactions` table were never updated, so other devices and pages could not see or audit these changes.
- **Why:** `Reports.generateInvoiceFromBuilder` and `Reports.deleteTransaction` treated `localStorage` as the primary database, updating stock and issue history directly on the client instead of using the central transactions API.
- **Fix (high level):** When the system is migrated to the backend (`DB_MIGRATED = true`), the reports page now uses the same `/transactions` and `/transactions/batch` endpoints as the rest of the app:
  - Creating technician issues from the builder generates real `issue` transactions in the backend.
  - Deleting a technician issue calls the server’s group-revert endpoint so inventory is restored centrally and consistently.

---

## Changes by area

### Frontend – purchase restock (`purchase-order.html`)

- **Before:** `PurchaseOrder.processImport` incremented `this.inventory[idx].stock` for each valid SKU and wrote the result back to `localStorage` (`App.KEYS.INVENTORY`), then showed a success card. No backend call was made, so the database inventory stayed unchanged.
- **After:**
  - `PurchaseOrder.processImport` is now `async`. It builds a `transactions` array from all valid restock lines, each entry containing:
    - `productId`: resolved from the matched inventory item’s `id`
    - `transactionType: 'purchase'`
    - `quantity`: positive restock quantity
    - `referenceId`: a shared batch reference (`PO-<timestamp>`)
    - `date` and a short `notes` field describing the source (“Restock via purchase-order page”).
  - It calls `POST /api/v1/transactions/batch` with `{ transactions }`, and if that fails due to missing endpoint or older backend, falls back to sending each transaction via `POST /transactions`.
  - After a successful server update, it calls `App.loadData()` to resync the local inventory/sales caches from the backend so the dashboard and inventory page see the updated stock.
  - The old code that directly modified `this.inventory` and wrote `localStorage.setItem(App.KEYS.INVENTORY, ...)` has been removed; all stock changes now go through the backend.
  - The UX remains the same for the user: the same success card is shown with “Items Restocked”, but it now represents server-confirmed state.

### Frontend – POS sales (`pos.html`)

- **Before:** `POS.checkout` decremented in-memory `this.inventory[productIndex].stock`, appended a synthetic `sale` object into `App.KEYS.SALES`, and wrote the updated inventory back to `App.KEYS.INVENTORY`. The backend never recorded these sales as inventory transactions and did not adjust the central stock.
- **After:**
  - `POS.checkout` is now `async`. It converts each cart line into a transaction object:
    - `productId`: product `id`
    - `transactionType: 'sale'`
    - `quantity`: **negative** of the sold quantity (so central inventory is decremented)
    - `referenceId`: shared sale reference (`SALE-<timestamp>`)
    - `date` and `notes: 'POS sale'`.
  - It submits this batch via `POST /api/v1/transactions/batch`, with fallback to per-line `POST /transactions` if the batch route is unavailable.
  - On success, it calls `App.loadData()` to refresh the local cache from the authoritative backend inventory and then:
    - Clears the cart and re-renders it.
    - Reloads inventory from `App.KEYS.INVENTORY` and re-renders the product grid so in-stock / low-stock / out-of-stock badges match the database.
    - Shows a receipt using the shared `SALE-<timestamp>` reference and the computed total.
  - All direct writes to `App.KEYS.INVENTORY` and synthetic `App.KEYS.SALES` entries for this flow have been removed, so there is no longer any device-only stock state.

### Frontend – Reports technician issues (`reports.html`)

- **Deleting technician issues**
  - **Before:** `Reports.deleteTransaction` manually added quantities back into `this.inventory`, wrote `App.KEYS.INVENTORY` and `App.KEYS.SALES` to `localStorage`, and treated that as the source of truth.
  - **After (migrated / backend mode):**
    - When `DB_MIGRATED` is `true`, `Reports.deleteTransaction` calls `DELETE /api/v1/transactions/group/{id}` (same pattern as `issue-part.html`) so the backend reverts the entire issue group and restores inventory in the database.
    - After a successful call, it invokes `App.loadData()`, then `Reports.syncData()` and `Reports.generate()` so the reports UI refreshes from the authoritative backend snapshot.
    - If the server returns 404 (legacy or already-reverted group), the UI reloads from the backend and shows an informational toast instead of silently mutating local data.
  - **Offline / legacy mode:** When `DB_MIGRATED` is not set, the previous local-only behavior is preserved as a fallback: it adjusts `this.inventory` and `this.sales` in `localStorage` and refreshes the UI.

- **Creating technician issues from the builder**
  - **Before:** `Reports.generateInvoiceFromBuilder`:
    - Validated selected parts against `this.inventory`.
    - Decremented local `inventory` and wrote it to `App.KEYS.INVENTORY`.
    - Created a synthetic `type: 'issue'` record in `App.KEYS.SALES` and added entries to `App.KEYS.MAPPINGS`, without touching the backend.
  - **After (migrated / backend mode):**
    - The builder still validates requested quantities against the current `this.inventory` snapshot but then builds a `transactions` payload:
      - One row per selected part with:
        - `productId`
        - `transactionType: 'issue'`
        - `quantity: -qty` (issuing parts reduces stock)
        - `mechanicId`: resolved from the selected mechanic name
        - `bikeId`: resolved from the selected bike plate (per part where provided, or from the selected bike set)
        - Shared `referenceId` (`INV-<timestamp>`)
        - `date` and `notes: 'Technician issue from reports builder'`.
    - It calls `POST /api/v1/transactions/batch` with `{ transactions }`, falling back to individual `POST /transactions` calls on error or older backends.
    - On success, it runs `App.loadData()`, followed by `Reports.syncData()` and `Reports.generate()`, so the reports tables, stats, and mechanic issue history reflect the new server-backed issues.
    - The print flow (`printTechnicianIssue`) still uses the collected `itemsForTransaction` to render a technician-facing document, but that document now corresponds to real backend transactions.
  - **Offline / legacy mode:** When `DB_MIGRATED` is not set, the former local-only logic remains as a fallback, updating `App.KEYS.INVENTORY`, `App.KEYS.SALES`, and `App.KEYS.MAPPINGS` for environments without a backend.

### Shared UX / safety improvements

- All three flows (purchase restock, POS checkout, and reports technician issues) now:
  - Use the central `inventory_transactions` API as the single source of truth whenever a backend is available.
  - Refresh their local view via `App.loadData()` after successful writes, so dashboard, inventory, reports, and issue-part pages all see the same stock and history.
  - Preserve legacy localStorage behavior only as an explicit offline fallback when `DB_MIGRATED` is not enabled.

---

## Testing suggestions

- **Purchase restock consistency**
  - Restock an existing SKU via the purchase page.
  - Reload the dashboard and inventory page (and/or open them on another device) and confirm the stock levels reflect the new quantity.
  - Verify the corresponding `inventory_transactions` rows are created with `transaction_type = 'purchase'` and correct quantities.

- **POS sale consistency**
  - From the POS page, sell a few items that have sufficient stock.
  - Reload the inventory page and dashboard and confirm stock has decreased by the sold quantity and low-stock badges update correctly.
  - Check that the backend has `inventory_transactions` records with `transaction_type = 'sale'` and negative quantities.

- **Reports technician issues**
  - Use the reports builder to generate a technician issue for a mechanic and one or more bikes; confirm:
    - The related `inventory_transactions` rows are created with `transaction_type = 'issue'` and negative quantities.
    - Reports mechanic issue tables and stats update correctly after `App.loadData()`.
  - Delete an existing technician issue from the reports page and confirm:
    - The corresponding transaction group is reverted via the API (no longer returned by `GET /transactions?type=issue`).
    - Inventory for each affected product increases by the issued quantity in the backend and is reflected across all pages after reload.


