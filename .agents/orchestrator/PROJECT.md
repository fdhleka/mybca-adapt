# Project: myBCA ADAPT Fullstack Interactive Simulation

## Architecture
- **Backend Architecture**: Node.js & Express server (`server/server.js`) with persistent SQLite relational database (`server/db/database.sqlite`) via `node:sqlite` in WAL mode.
- **Data Persistence**: Relational schema across 9 tables (`users`, `accounts`, `features`, `user_features`, `transactions`, `life_event_rules`, `user_life_events`, `audit_logs`, `simulation_scenarios`) with strict FOREIGN KEY constraints, cascades, indexes, and integer IDR currency balance accounting.
- **REST API Layer**: Standardized JSON endpoints for authentication, persona profiles, accounts, multi-period transactions, manual transaction injection, 1-click feature activation, bundle claims, AI recalculations, live audit log stream, and 1-click atomic database reset.
- **Frontend Architecture**: Authentic single-page application (`public/index.html`, `public/js/app.js`, `public/css/custom-adapt.css`) inheriting official styling from `combined-styles-komplit.css`, responsive layout, underline input forms, masked balance toggle, quick banking actions, dynamic transaction history, Smart Bundling modals, and a collapsible Audit Engine Inspector drawer.
- **3 AI Engines**:
  1. *Algoritma 1 (Transaction Personalization)*: Normalized frequency (60%) + amount (40%) propensity scoring with ranked contextual recommendations and 1-click activation.
  2. *Algoritma 2 (Life Event Detection & Smart Bundling)*: Multi-period category shift analysis comparing baseline ($T-1$) vs current ($T$), triggering life-stage bundles when confidence $\ge 60\%$.
  3. *Algoritma 3 (Financial Health Gamification Score)*: Dynamic 0-100 weighted score (Base 20 + feature adoption points + timeliness bonus + savings bonus) with Bronze/Silver/Gold/Diamond tiers and instant real-time recalculation upon feature activation.

## Feature Inventory
| # | Feature ID | Name | Description | Milestone | Source |
|---|------------|------|-------------|-----------|--------|
| 1 | F1.1 | Authentic Login Shell | Authentic myBCA login styling, BCA Sans typography, official blue gradient, underline inputs | M2 | ORIGINAL_REQUEST §R1 |
| 2 | F1.2 | Form Input & Validation | BCA ID and Password form input with authentic feedback | M2 | ORIGINAL_REQUEST §R1 |
| 3 | F1.3 | Judge Quick Switcher | 1-click persona auto-fill/login helper for judges (5 personas) | M2 | ORIGINAL_REQUEST §R1 |
| 4 | F1.4 | Session Management | Server-side session token and active persona state tracking | M2 | ORIGINAL_REQUEST §R1 |
| 5 | F1.5 | Logout Flow | Session termination and seamless return to login screen | M2 | ORIGINAL_REQUEST §R1 |
| 6 | F2.1 | Express Server | Lightweight Node.js/Express server serving APIs and static assets | M1 | ORIGINAL_REQUEST §R2 |
| 7 | F2.2 | SQLite Schema & Tables | 9 relational tables with foreign keys, cascades, indexes, and integer accounting | M1 | ORIGINAL_REQUEST §R2 |
| 8 | F2.3 | Seed Datasets | Initial seed data for 5 personas, 12 features, 5 life event rules, and 35 mutations | M1 | ORIGINAL_REQUEST §R2 |
| 9 | F2.4 | 1-Click Database Reset | Atomic reset endpoint (`POST /api/admin/reset`) restoring pristine seeds in <50ms | M1 | ORIGINAL_REQUEST §R2 |
| 10 | F3.1 | Dashboard Visual Shell | Official myBCA dashboard layout adapted from full-website-code.html | M3 | ORIGINAL_REQUEST §R3 |
| 11 | F3.2 | Dynamic Customer Header | Real-time customer name, masked BCA ID, avatar, and last login time | M3 | ORIGINAL_REQUEST §R3 |
| 12 | F3.3 | Dynamic Account Card | Tahapan BCA account number, balance display, and eye-icon masked balance toggle | M3 | ORIGINAL_REQUEST §R3 |
| 13 | F3.4 | Dynamic Quick Features | 6 authentic banking action cards (Transfer, Welma, Proteksi, etc.) | M3 | ORIGINAL_REQUEST §R3 |
| 14 | F3.5 | Dynamic Mutasi History | Live transaction list with dates, categories, CR/DB color coding, and IDR amounts | M3 | ORIGINAL_REQUEST §R3 |
| 15 | F4.1 | Algoritma 1 Engine | Transaction propensity vector engine based on frequency (60%) and amount (40%) | M4 | ORIGINAL_REQUEST §R4 |
| 16 | F4.2 | Contextual Recommendations | Ranked feature recommendations feed with match percentage and 1-click activation | M4 | ORIGINAL_REQUEST §R4 |
| 17 | F4.3 | Algoritma 2 Engine | Multi-period category shift detector across 5 life stages (baseline vs current) | M4 | ORIGINAL_REQUEST §R4 |
| 18 | F4.4 | Smart Bundling Trigger | Modal / banner prompt when confidence >= 60% with 1-click bundle claim | M4 | ORIGINAL_REQUEST §R4 |
| 19 | F4.5 | Algoritma 3 Gamification | Dynamic 0-100 score engine mapped to Bronze/Silver/Gold/Diamond tiers | M4 | ORIGINAL_REQUEST §R4 |
| 20 | F4.6 | Live Recalculation | Instant cascade update of score and tiers upon feature activation or new mutations | M4 | ORIGINAL_REQUEST §R4 |
| 21 | F5.1 | Simulation Demo Scenarios | Quick scenario injection presets (Fresh Grad Kit, Rumah Tangga Kit, Pro Merchant Kit) | M5 | ORIGINAL_REQUEST §R5 |
| 22 | F5.2 | Manual Data Injector | Transaction form modifying database balance and triggering AI recalculation cascade | M5 | ORIGINAL_REQUEST §R5 |
| 23 | F5.3 | Audit Engine Inspector | Collapsible inspector drawer with mathematical formulas and live decision logs | M5 | ORIGINAL_REQUEST §R5 |
| 24 | F6.1 | E2E Automated Test Suite | Comprehensive opaque-box test suite (Tiers 1-4) verifying all acceptance criteria | M6 | ORIGINAL_REQUEST §Acceptance Criteria |
| 25 | F6.2 | 100% Verification Pass | Full verification pass across all tiers, endpoints, UI flows, and forensic audit | M6 | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| M1 | Backend & Relational Persistence | Express server, SQLite schema, seed data, REST endpoints, 1-click DB reset | None | DONE |
| M2 | Authentic Login & Authentication | myBCA login UI, Judge Quick Switcher helper, session management, logout | M1 | DONE |
| M3 | Reactive Dashboard & Data Binding | Live customer greeting, account card balance toggle, quick actions, mutasi list | M1, M2 | DONE |
| M4 | 3 AI Engine Algorithms & Recalculation | Propensity recommendations, Life Event bundling >=60%, Gamification 0-100 score | M1, M3 | DONE |
| M5 | Interactive Simulation Lab & Audit Drawer | Scenario runner, manual transaction injector, live balance update, audit inspector | M1, M3, M4 | DONE |
| M6 | E2E Verification & Audit Compliance | Run automated E2E test runner (Tiers 1-4), adversarial stress tests, forensic audit | M1, M2, M3, M4, M5 | DONE |

## Interface Contracts
### Client ↔ Server Auth Contract
- `POST /api/auth/login`: `{ username, password }` -> `{ success: true, token, user }`
- `POST /api/auth/quick-login`: `{ personaId }` -> `{ success: true, token, user }`
- `GET /api/auth/session`: Header `Authorization: Bearer <token>` -> `{ authenticated: true, user }`
- `POST /api/auth/logout`: -> `{ success: true }`
- `GET /api/personas`: -> `[ { id, bca_id, name, avatar, job, baseline_score, ... } ]`

### Client ↔ Server Account & Mutation Contract
- `GET /api/accounts/me`: -> `{ account_number, account_type, balance, currency, holder_name }`
- `GET /api/transactions`: Query `?period=all|current|baseline` -> `[ { id, date, amount, type, category, description } ]`
- `POST /api/transactions/inject`: `{ description, category, amount, type }` -> `{ success: true, new_balance, transaction, ai_recalculation }`

### Client ↔ Server AI Engine Contract
- `GET /api/ai/status`: -> `{ propensity: [ ... ], life_event: { event_type, confidence, bundle_triggered, ... }, gamification: { score, tier, breakdown, ... } }`
- `POST /api/features/:id/activate`: -> `{ success: true, feature_id, new_score, new_tier, logs }`
- `POST /api/bundles/:id/activate`: -> `{ success: true, bundle_id, activated_features, new_score, new_tier, logs }`
- `POST /api/admin/reset`: -> `{ success: true, message: "Database reset to initial seeds" }`
- `GET /api/ai/audit-logs`: -> `[ { timestamp, engine, level, message } ]`

## Code Layout
- `server/`
  - `server.js` (Express entry point)
  - `db/`
    - `schema.sql` (SQLite DDL)
    - `database.js` (SQLite connection & query helpers)
    - `seed.js` (Seed dataset population & atomic reset)
  - `engines/`
    - `personalization.js` (Algoritma 1)
    - `lifeEvent.js` (Algoritma 2)
    - `gamification.js` (Algoritma 3)
  - `routes/`
    - `auth.js`, `accounts.js`, `transactions.js`, `features.js`, `bundles.js`, `ai.js`, `admin.js`, `simulation.js`
- `public/`
  - `index.html` (Single-page app with Login & Dashboard views)
  - `css/`
    - `combined-styles-komplit.css`
    - `custom-adapt.css`
  - `js/`
    - `app.js` (Frontend controller, reactive state, API integration)
- `tests/`
  - `e2e_runner.js` (Automated opaque-box E2E test runner, 89 tests)
  - `stress_suite.js` (Adversarial stress and concurrency suite, 18 tests)
  - `challenger_2_adversarial.js` (AI algorithm stress suite, 34 tests)
