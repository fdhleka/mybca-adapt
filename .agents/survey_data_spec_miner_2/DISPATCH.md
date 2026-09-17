# Task Dispatch: Data Models, Personas & Backend Architecture Spec Mining

## Objective
Analyze `C:\Users\irul2\Downloads\Bahan YNFest\prototype\seed-data.js`, `C:\Users\irul2\Downloads\Bahan YNFest\prototype\app.js`, and `C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md` to design the complete relational persistent database schema, seed datasets, API endpoints, and reset mechanism.

## Investigation Scope
1. Examine `prototype/seed-data.js` and `prototype/app.js`:
   - Enumerate all personas (Dimas, Ayu, Sari, Rina, Bambang, etc.): BCA ID, name, email, avatar, job, financial health baseline, active features, accounts, and historical transactions.
   - Analyze transaction schema: id, account_id, date, amount, type (DB/CR), category, description, merchant/recipient, period (baseline vs current).
   - Analyze user_features and life_events schemas and initial states.
2. Formulate Relational Schema:
   - Tables: `users` / `personas`, `accounts`, `transactions`, `user_features`, `life_events`.
   - Foreign keys, constraints, and initial seeding scripts.
   - Determine the best lightweight persistent database solution (SQLite via `better-sqlite3` or `sqlite3`, or structured JSON/SQL relational engine in Node.js) that runs self-contained without external services.
3. Design Backend REST API specifications:
   - Auth endpoints (`/api/auth/login`, `/api/auth/logout`, `/api/auth/session`, `/api/personas`).
   - Account & Transaction endpoints (`/api/accounts`, `/api/transactions`, `/api/transactions/inject`).
   - Feature endpoints (`/api/features`, `/api/features/:id/activate`, `/api/bundles/activate`).
   - AI recalculation & evaluation endpoints (`/api/ai/recalculate`, `/api/ai/status`).
   - Reset endpoint (`/api/admin/reset`).

## Required Output
Write a comprehensive report to `C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_data_spec_miner_2\report.md` including:
- Exact data models & table DDL / schema.
- Full inventory of all personas and seed data details.
- REST API endpoint specifications with request/response payloads.
- Handoff file `C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_data_spec_miner_2\handoff.md`.

## 2026-09-11T14:18:54Z
You are a Spec Miner for the myBCA ADAPT Interactive Simulation project.
Read C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md first (mandatory!).
Your working directory is C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_data_spec_miner_2.
Read your dispatch assignment at C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_data_spec_miner_2\DISPATCH.md.

Analyze C:\Users\irul2\Downloads\Bahan YNFest\prototype\seed-data.js, C:\Users\irul2\Downloads\Bahan YNFest\prototype\app.js, and C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md.
Investigate:
1. Exact data models and schema for: users/personas (Dimas, Ayu, Sari, Rina, Bambang), accounts, transactions (baseline vs current periods), user_features, and life_events.
2. Relational persistence architecture using lightweight Node.js/Express + SQLite (e.g. better-sqlite3 or sqlite3) or relational persistent store.
3. Complete REST API endpoints specification (auth, accounts, transactions, injection, features, bundles, AI recalculation, and 1-click DB Reset).
4. Concrete seed datasets for all 5 personas.

Write your findings to C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_data_spec_miner_2\report.md and create a self-contained handoff.md.
Notify the orchestrator with send_message when complete.

