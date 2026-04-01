# Pull request: operational logs, dashboard print, returns search

## Summary

Adds staff workflows for **Passing Bike** (registered bike parts issuance), **Dubai** (manual bike + part text log), **Passing IN/Out Bike** (rider gate log), improves **Returns** item lookup, adds a dedicated **Out of stock** dashboard panel with **print**, fixes migration SQL splitting when comments contained semicolons, and mounts new **`/api/v1/passing-logs`** endpoints.

## Backend

- **Migrations:** `dubai_manual_part_entries`, `rider_bike_movements` (comment text adjusted so `schema.split(';')` does not break).
- **New module:** `passing-logs` — `GET/POST /passing-logs/dubai-entries`, `GET/POST /passing-logs/rider-movements` (auth + role checks aligned with other staff routes).
- **`app.ts`:** Registers `passingLogsRoutes` under `/api/v1/passing-logs`.

## Frontend

- **New pages:** `passing-bike.html`, `dubai-bike.html`, `passing-in-out-bike.html`.
- **Sidebar:** New links added across main HTML shells.
- **Dashboard:** Out-of-stock list + print (popup window with table).
- **Returns:** Search field filters the item `<select>` by name/SKU.

## How to test

1. Run migrations (start server or run your migration path); confirm tables exist.
2. **Passing Bike:** Select bike, add parts, submit — inventory should decrease; issues visible under transactions.
3. **Dubai:** Submit rows — rows appear in “Recent Dubai entries”; stock unchanged.
4. **Passing IN/Out:** Submit with checkbox IN/OUT — appears in recent movements.
5. **Returns:** Type in part search — dropdown shortlists matching parts.
6. **Dashboard:** Open Out of Stock → Print list (allow pop-ups if needed).

## Notes

- `backend/dist` is gitignored; this branch includes force-added `dist` updates needed for `node dist/server.js` without a local build. Re-run `npm run build` after TS changes before release.

## Suggested commit subjects (already applied locally)

Use a single commit or split as you prefer:

- `feat: passing bike, dubai log, rider IN/OUT, dashboard OOS print, returns search`
- `fix: migration comment semicolon breaking SQL split`
