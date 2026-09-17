# Task Dispatch: Milestone 1 — Backend Server, SQLite Persistence & Seed Engine

## Objective
Implement the complete backend foundation for myBCA ADAPT: Express web server, persistent SQLite relational database, comprehensive seed datasets for all 5 personas, full REST API endpoints, and 1-click database reset.

## Requirements
Read `C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md` and `C:\Users\irul2\Downloads\Bahan YNFest\.agents\orchestrator\PROJECT.md`.
Read technical specifications from:
- `C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_data_spec_miner_2\report.md`
- `C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_ai_spec_miner_3\report.md`
Your working directory is `C:\Users\irul2\Downloads\Bahan YNFest\.agents\m1_worker_1`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Implementation Scope & Write Ownership
You exclusively own and will create:
- `package.json` (Express, SQLite dependencies, startup scripts)
- `server/server.js` (Express entry point, static asset serving, CORS, JSON middleware, error handling, port 3000)
- `server/db/schema.sql` (9 relational tables: `users`, `accounts`, `features`, `user_features`, `transactions`, `life_event_rules`, `user_life_events`, `audit_logs`, `simulation_scenarios` with foreign keys and indexes)
- `server/db/database.js` (SQLite initialization and query interface using `node:sqlite` or `better-sqlite3`/`sqlite3`)
- `server/db/seed.js` (Deterministic seeding of 5 personas, 12 features, 5 life event rules, 3 scenarios, and 35 categorized mutations)
- `server/routes/auth.js` (Login with BCA ID/pass, Judge Quick-Login, session lookup, logout)
- `server/routes/accounts.js` (Active account details, balance retrieval)
- `server/routes/transactions.js` (Multi-period transaction retrieval, manual injection with atomic balance update)
- `server/routes/features.js` (Feature catalog, 1-click feature activation, bundle activation)
- `server/routes/ai.js` (AI status, audit logs)
- `server/routes/admin.js` (1-click atomic DB reset endpoint `POST /api/admin/reset`)

## Verification Requirement
1. Initialize npm dependencies and SQLite database.
2. Run database migration and seed script.
3. Verify that all 5 personas exist in SQLite with correct balances and mutations.
4. Verify that running `POST /api/admin/reset` cleanly wipes and re-seeds all tables in <50ms.
5. Provide concrete verification commands and test execution output in your handoff.

Write handoff report to `C:\Users\irul2\Downloads\Bahan YNFest\.agents\m1_worker_1\handoff.md`.

## 2026-09-11T14:35:37Z
You are a Worker implementing Milestone 1 (Backend Server, SQLite Persistence & Seed Engine) for the myBCA ADAPT project.
Read C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md first (mandatory!).
Read your dispatch assignment at C:\Users\irul2\Downloads\Bahan YNFest\.agents\m1_worker_1\DISPATCH.md.
Read C:\Users\irul2\Downloads\Bahan YNFest\.agents\orchestrator\PROJECT.md.
Read specification reports at:
- C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_data_spec_miner_2\report.md
- C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_ai_spec_miner_3\report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement:
- package.json
- server/server.js
- server/db/schema.sql
- server/db/database.js
- server/db/seed.js
- server/routes/auth.js, accounts.js, transactions.js, features.js, ai.js, admin.js

Verify SQLite migration, seeding, and the 1-click reset endpoint (POST /api/admin/reset).
Document commands and verification results in your handoff report at C:\Users\irul2\Downloads\Bahan YNFest\.agents\m1_worker_1\handoff.md.
Notify the orchestrator with send_message when complete.
