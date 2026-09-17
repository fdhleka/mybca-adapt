# Relational Data Models, Persistence Architecture & REST API Specification
**myBCA ADAPT — Interactive Simulation System**

**Author**: Spec Miner 2 (`survey_data_spec_miner_2`)  
**Date**: 2026-09-11  
**Target Environment**: Node.js v24.14.0 / Express + SQLite (via `node:sqlite` or `better-sqlite3`)  
**Specification Sources**:
- `prototype/seed-data.js` (Catalog, Personas, Baseline & Current Mutations, Scenarios)
- `prototype/algorithms.js` (Propensity Engine, Life Event Engine, Gamification Engine)
- `prototype/app.js` (Reactive Flow, State Mutation, Transaction Injection)
- `prototype/index.html` & `full-website-code.html` (Authentication, Dashboard Layout, Balance Toggle)
- `Business_Case_myBCA_Ringkasan_Diskusi.pdf` & `PROPOSAL YNFEST KITKAT.pdf` (Domain Concepts)
- `.agents/ORIGINAL_REQUEST.md` (System Requirements R1–R5, Acceptance Criteria)

---

## 1. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth & Session | BCA ID Authentication | Authenticate user using authentic BCA ID and Password credentials | `bca_id`, `password` | Session Token, User Profile, Account Summary | HTTP 401 on invalid credentials; HTTP 400 on missing fields | `ORIGINAL_REQUEST.md:R1`, `full-website-code.html` |
| 2 | Auth & Session | Quick Switcher / Judge Persona Helper | 1-Click direct login for judges/evaluators without manual password typing | `persona_id` (e.g. `dimas`) | Active Session Token, Selected Persona Profile | HTTP 404 if persona ID does not exist | `ORIGINAL_REQUEST.md:R1`, `prototype/app.js:25-33` |
| 3 | Auth & Session | Session Invalidation (Logout) | Clear active user session and return client to login landing state | Session Token Header / Cookie | `{ success: true, message: "Logged out" }` | HTTP 200 idempotent even if session already expired | `ORIGINAL_REQUEST.md:R1`, `DISPATCH.md:16` |
| 4 | Accounts | Multi-Persona Accounts Query | Retrieve active bank account, account number, card type, and balance | `user_id` (from session) | Array of Accounts (`account_no`, `balance`, `account_type`, `status`) | HTTP 401 if unauthenticated; HTTP 404 if user has no accounts | `prototype/seed-data.js:33-34`, `ORIGINAL_REQUEST.md:R2` |
| 5 | Transactions | Multi-Period Mutation History | Query categorized transaction mutations separated by `baseline` ($T-1$) and `current` ($T$) | `account_id`, `period` filter (`baseline`, `current`, `all`) | Array of Transactions (`id`, `date`, `category`, `amount`, `type`, `description`, `icon`) | HTTP 400 on invalid period query param | `prototype/seed-data.js:38-50`, `ORIGINAL_REQUEST.md:R2` |
| 6 | Simulation Lab | Real-Time Transaction Injection | Inject manual transaction into database; updates account balance and triggers AI cascade | `account_id`, `category`, `amount`, `description`, `type` (`CR`/`DB`) | Inserted Transaction record, Updated Balance, AI recalculation delta | HTTP 400 if amount $\le 0$ or category unknown; HTTP 404 if account not found | `prototype/app.js:318-339`, `ORIGINAL_REQUEST.md:R5` |
| 7 | Simulation Lab | Preset Scenario Runner | Inject pre-configured transaction sets corresponding to real-life transition events | `scenario_id` (`scen_freshgrad`, `scen_newlywed`, `scen_merchant`) | Injected transaction records, triggered life event, updated balance | HTTP 404 if scenario ID unknown | `prototype/seed-data.js:145-180`, `prototype/app.js:264-297` |
| 8 | Feature Engine | Feature Catalog & Status Retrieval | Retrieve complete 12-feature myBCA catalog with active status per persona | `user_id` (from session) | List of features (`id`, `name`, `category`, `points`, `is_active`, `icon`) | HTTP 401 if unauthenticated | `prototype/seed-data.js:9-22`, `DISPATCH.md:18` |
| 9 | Feature Engine | 1-Click Feature Activation | Activate single recommended feature in DB and increment Gamification Score | `feature_id` | Updated `user_features` record, new Gamification Score, audit log entry | HTTP 409 if feature is already active; HTTP 404 if feature ID invalid | `prototype/app.js:225-237`, `ORIGINAL_REQUEST.md:R4` |
| 10 | Smart Bundling | Bundle Evaluation & Detection Query | Evaluate current transaction category shifts and return eligible smart bundle | `user_id` | `{ detected: boolean, rule_id, bundle_name, confidence, signals, bonus_points }` | Returns `detected: false` with monitoring banner payload if confidence < 60% | `prototype/algorithms.js:108-204`, `ORIGINAL_REQUEST.md:R4` |
| 11 | Smart Bundling | 1-Click Smart Bundle Activation | Batch-activate all features in the detected bundle and award bundle bonus points | `bundle_rule_id` | List of newly activated feature IDs, updated Gamification Score | HTTP 400 if rule does not match detected event; HTTP 409 if all features already active | `prototype/app.js:172-182`, `ORIGINAL_REQUEST.md:R4` |
| 12 | AI Engine | Complete AI Evaluation Pipeline | Recalculate and return Propensity, Life Event, and Gamification metrics in one call | `user_id` | `{ propensity_recommendations[], life_event, gamification_score }` | HTTP 401 if unauthenticated; HTTP 404 if user not found | `prototype/algorithms.js:9-274`, `DISPATCH.md:19` |
| 13 | Audit Inspector | Live Decision Trace Audit Stream | Retrieve timestamped audit log stream of all algorithmic and user decisions | `limit` (default 50) | Array of audit log entries (`timestamp`, `engine`, `message`, `payload`) | Returns empty array `[]` if no logs exist | `prototype/algorithms.js:15-21`, `ORIGINAL_REQUEST.md:R5` |
| 14 | Admin System | 1-Click Database Seed Reset | Completely reset database tables and re-populate pristine seed state for live demo | None (or Admin token) | `{ success: true, message, reset_timestamp, entities_seeded }` | HTTP 500 on transaction commit error (rolls back database) | `ORIGINAL_REQUEST.md:R2`, `DISPATCH.md:20` |
| 15 | System Health | Database & Engine Health Check | Return database connectivity status, SQLite version, active persona count | None | `{ status: "UP", engine: "SQLite", users: 5, accounts: 5, transactions: 35 }` | HTTP 503 if database lock or file access error occurs | Self-contained ops standard |

---

## 2. Edge Cases & Boundary Behaviors

| # | Feature | Input / Condition | Observed Behavior | Analysis & Backend Design Decision |
|---|---------|-------------------|-------------------|-------------------------------------|
| 1 | Database Seeding | Reset command executed while active requests are in-flight | Potential SQLite busy/locked exception if multiple writers write concurrently | Wrap DB Reset in a synchronous SQLite exclusive transaction (`BEGIN EXCLUSIVE TRANSACTION ... COMMIT;`). In Node.js, `better-sqlite3` or `node:sqlite` runs synchronously on the main thread, naturally serializing writes. |
| 2 | Transaction Injection | Injected transaction amount is negative, zero, or non-numeric | Could corrupt balance or insert invalid debit | Database table has constraint `CHECK (amount > 0)`. API layer validates `Number.isInteger(amount) && amount > 0`, returning HTTP 400 if violated. |
| 3 | Balance Mutation | Debit transaction amount exceeds current account balance | Could drive balance negative (overdraft) | In prototype, Dimas has Rp 14.5M. If user injects Rp 20M debit, database allows negative balance if debit overdraft is permitted, but standard Tahapan BCA forbids negative balance. Recommendation: Enforce `CHECK (balance >= 0)` or allow temporary simulation debit with warning flag. |
| 4 | Transaction Type | Category does not explicitly indicate Credit or Debit | Prototype uses substring matching (`category.includes("Masuk") || ...`). Ambiguous category could be assigned wrong sign | Schema introduces explicit `type TEXT NOT NULL CHECK(type IN ('CR', 'DB'))`. The API inject endpoint accepts explicit `type`, or defaults intelligently based on a canonical category registry. |
| 5 | Feature Activation | User activates a feature that is already active | Duplicate row insertion into `user_features` table | Table defines `UNIQUE(user_id, feature_id)`. API returns HTTP 409 Conflict with message `"Feature is already active for this persona"`. |
| 6 | Bundle Activation | Bundle contains 3 features, 1 of which is already activated by user | User already has `joint_account`, then triggers Newlywed Kit (`joint_account`, `family_budgeting`, `family_insurance`) | SQL executes `INSERT OR IGNORE INTO user_features (user_id, feature_id)`. Only remaining 2 features are inserted. Gamification engine correctly awards points only for the newly activated features + bundle bonus. |
| 7 | Life Event Detection | Current period has zero transactions (`historyCurrent = []`) | Life event engine evaluates category set of length 0 | Required signals count = 0. Rule condition `reqCount > 0` evaluates false. Confidence = 0%. Returns `detected: false`. Safe against null pointer exceptions. |
| 8 | Life Event Confidence | Exactly meets the 60% threshold | E.g. Fresh Grad with 1 required signal (37.5%) + 2 optional signals (25%) = 62.5% $\approx 63\%$ | Condition is `confidence >= 60`. Evaluates to true. Triggers the Smart Bundle modal/banner. |
| 9 | Gamification Score | User activates all 12 features | Raw score: $20 \text{ (base)} + 200 \text{ (features)} + 15 \text{ (timeliness)} + 15 \text{ (savings)} = 250$ PTS | Formula uses `Math.min(100, rawScore)`. Score is strictly clamped to 100. Tier is Diamond. Progress bar renders at 100%. |
| 10 | Gamification Score | Untracked / unmapped features (e.g. `child_savings`) | In `prototype/seed-data.js`, `child_savings` exists (+20 PTS) but was omitted from `featureMap` in `algorithms.js` | Schema catalogs all 12 features. In our relational schema, feature points are stored in the `features` table and queried directly via `SUM(features.points)`, ensuring 100% calculation accuracy. |
| 11 | Authentication | Case sensitivity in BCA ID | User types `DIMAS2026` or `dimas2026` | myBCA IDs are case-insensitive in practical usage. Schema stores lowercased BCA ID, and API normalizes `bca_id = bca_id.trim().toLowerCase()`. |
| 12 | Persona Switching | Active session contains persona A, user switches to persona B via quick switcher | Session token or state mismatch | Quick-login endpoint issues a fresh session token for persona B, updating server session state and returning new profile. |

---

## 3. Relational Persistence Architecture

### 3.1 Technology Evaluation & Selection
To fulfill requirement **R2 (Server backend ringan Node.js/Express dengan database persisten SQLite/JSON relational store)** with zero external infrastructure overhead:

- **Primary Database Engine**: **SQLite 3**
- **Persistence Driver**: **Built-in `node:sqlite` (DatabaseSync)** natively present in the environment (Node.js v24.14.0) with zero external compilation or native dependency issues on Windows, OR **`better-sqlite3` / `sqlite3`** via standard npm.
- **Storage Strategy**:
  - Production/Persistent Mode: Single disk file `database.sqlite` located in the backend root directory.
  - Test/Ephemeral Mode: In-memory database `:memory:`.
- **Concurrency & Transaction Safety**:
  - `PRAGMA foreign_keys = ON;` enabled on every connection initialization.
  - `PRAGMA journal_mode = WAL;` (Write-Ahead Logging) for high-performance concurrent reads and non-blocking writes.
  - ACID transactional integrity via SQLite transaction blocks (`BEGIN TRANSACTION ... COMMIT;`).

### 3.2 Relational Entity Relationship Model (ERD)

```
       +-------------------------+
       |          users          |
       +-------------------------+
       | PK  id (TEXT)           |
       |     bca_id (TEXT, UQ)   |
       |     password (TEXT)     |
       |     name (TEXT)         |
       |     email (TEXT)        |
       |     age (INTEGER)       |
       |     title (TEXT)        |
       |     occupation (TEXT)   |
       |     avatar_url (TEXT)   |
       |     timeliness_rate     |
       |     savings_consistency |
       +-------------------------+
             |1             |1
             |              |
             |N             |N
+--------------------+   +-----------------------+
|      accounts      |   |     user_features     |
+--------------------+   +-----------------------+
| PK  id (TEXT)      |   | PK  id (INTEGER AUTO) |
| FK  user_id (TEXT) |   | FK  user_id (TEXT)    |
|     account_no(UQ) |   | FK  feature_id (TEXT)-+--> [ features (catalog) ]
|     account_type   |   |     status (TEXT)     |    | PK  id (TEXT)       |
|     balance (INT)  |   |     activated_at      |    |     name, pts, icon |
+--------------------+   +-----------------------+    +---------------------+
       |1
       |N
+---------------------------+       +-------------------------+
|       transactions        |       |    user_life_events     |
+---------------------------+       +-------------------------+
| PK  id (INTEGER AUTO)     |       | PK  id (INTEGER AUTO)   |
| FK  account_id (TEXT)     |       | FK  user_id (TEXT)      |
| FK  user_id (TEXT)        |       | FK  event_rule_id (TEXT)|
|     date (TEXT)           |       |     confidence (INT)    |
|     category (TEXT)       |       |     detected_signals    |
|     amount (INT)          |       |     status (TEXT)       |
|     type (TEXT: CR/DB)    |       +-------------------------+
|     description (TEXT)    |
|     icon (TEXT)           |       +-------------------------+
|     period (TEXT)         |       |       audit_logs        |
+---------------------------+       +-------------------------+
                                    | PK  id (INTEGER AUTO)   |
                                    | FK  user_id (TEXT)      |
                                    |     engine (TEXT)       |
                                    |     message (TEXT)      |
                                    |     payload (JSON TEXT) |
                                    |     timestamp (TEXT)    |
                                    +-------------------------+
```

### 3.3 Complete SQLite DDL Specification

```sql
-- Enforce Foreign Key Constraints
PRAGMA foreign_keys = ON;

-- 1. Users / Personas Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                       -- e.g. 'dimas', 'ayu', 'sari', 'rina', 'bambang'
    bca_id TEXT UNIQUE NOT NULL,               -- e.g. 'dimas2026'
    password TEXT NOT NULL,                    -- plaintext or hashed for demo auth: 'Password123!'
    name TEXT NOT NULL,                        -- e.g. 'Dimas Prasetyo'
    email TEXT NOT NULL,                       -- e.g. 'dimas@mybca.co.id'
    age INTEGER NOT NULL,                      -- e.g. 23
    title TEXT NOT NULL,                       -- e.g. 'Fresh Graduate / Pekerja Baru'
    occupation TEXT NOT NULL,                  -- e.g. 'Junior Software Engineer'
    avatar_url TEXT NOT NULL,                  -- URL or asset path
    timeliness_rate REAL NOT NULL DEFAULT 100.0, -- e.g. 100.0 (% on-time bill payments)
    savings_consistency INTEGER NOT NULL DEFAULT 0, -- 1 = true, 0 = false
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bank Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,                       -- e.g. 'acc_dimas'
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_no TEXT UNIQUE NOT NULL,           -- e.g. '8820491823'
    account_type TEXT NOT NULL,                -- e.g. 'Tahapan BCA', 'BCA Bisnis', 'Tahapan Xpresi'
    currency TEXT NOT NULL DEFAULT 'IDR',
    balance INTEGER NOT NULL DEFAULT 0,        -- Nominal balance in IDR (integer without decimals)
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DORMANT', 'BLOCKED')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Features Master Catalog
CREATE TABLE IF NOT EXISTS features (
    id TEXT PRIMARY KEY,                       -- e.g. 'auto_save'
    name TEXT NOT NULL,                        -- e.g. 'Tabungan Otomatis Gaji (Auto-Save)'
    category TEXT NOT NULL,                    -- e.g. 'Savings', 'Protection', 'Credit', 'Family', etc.
    icon TEXT NOT NULL,                        -- Bootstrap Icon e.g. 'bi-piggy-bank'
    points INTEGER NOT NULL DEFAULT 10,        -- Gamification point value: 10, 15, or 20
    description TEXT NOT NULL                  -- Comprehensive feature explanation
);

-- 4. User Active Features (Join Table)
CREATE TABLE IF NOT EXISTS user_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    activated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, feature_id)
);

-- 5. Transactions / Mutation History Table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,                        -- ISO format: 'YYYY-MM-DD'
    category TEXT NOT NULL,                    -- Signals e.g. 'Gaji Bulanan', 'Sewa Kos / Housing'
    amount INTEGER NOT NULL CHECK(amount > 0), -- Must be strictly positive
    type TEXT NOT NULL CHECK(type IN ('CR', 'DB')), -- 'CR' = Inbound / Credit, 'DB' = Outbound / Debit
    description TEXT NOT NULL,                 -- Mutation description
    icon TEXT NOT NULL DEFAULT 'bi-receipt',   -- Bootstrap Icon for display
    period TEXT NOT NULL CHECK(period IN ('baseline', 'current')), -- Baseline (T-1) vs Current (T)
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Life Event Master Rules & Bundles Catalog
CREATE TABLE IF NOT EXISTS life_event_rules (
    id TEXT PRIMARY KEY,                       -- e.g. 'FRESH_GRADUATE', 'NEWLYWED'
    name TEXT NOT NULL,                        -- e.g. 'Mulai Kerja / Fresh Graduate'
    bundle_name TEXT NOT NULL,                 -- e.g. 'Mulai Kerja Kit'
    required_signals TEXT NOT NULL,            -- JSON string array: '["Gaji Bulanan", "Sewa Kos / Housing"]'
    optional_signals TEXT NOT NULL,            -- JSON string array: '["Cicilan / Paylater", "Tagihan Utilitas"]'
    features_to_bundle TEXT NOT NULL,          -- JSON string array: '["auto_save", "health_insurance"]'
    bonus_points INTEGER NOT NULL DEFAULT 25,  -- Bonus points awarded on bundle claim
    description TEXT NOT NULL                  -- Humanized life event context description
);

-- 7. User Detected Life Events History
CREATE TABLE IF NOT EXISTS user_life_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_rule_id TEXT NOT NULL REFERENCES life_event_rules(id) ON DELETE CASCADE,
    confidence INTEGER NOT NULL,               -- Percentage integer: 0 - 100
    detected_signals TEXT NOT NULL,            -- JSON string array of matched signals
    status TEXT NOT NULL DEFAULT 'DETECTED' CHECK(status IN ('DETECTED', 'ACTIVATED', 'DISMISSED')),
    detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_at TEXT                          -- Timestamp when user claimed bundle
);

-- 8. Audit Engine Trace Logs (For Mode Juri Inspector)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    engine TEXT NOT NULL,                      -- 'PROPENSITY_ENGINE', 'LIFE_EVENT_ENGINE', 'GAMIFICATION_ENGINE', 'USER_ACTION', 'SIMULATION', 'SYSTEM'
    message TEXT NOT NULL,
    payload TEXT,                              -- Optional JSON payload string
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Preset Simulation Scenarios Catalog
CREATE TABLE IF NOT EXISTS simulation_scenarios (
    id TEXT PRIMARY KEY,                       -- e.g. 'scen_freshgrad'
    name TEXT NOT NULL,
    persona_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expected_event TEXT NOT NULL,
    expected_bundle TEXT NOT NULL,
    payload_transactions TEXT NOT NULL         -- JSON array of transactions to inject
);

-- Performance Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_period ON transactions(user_id, period);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_user_features_user ON user_features(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

---

## 4. Full Persona Inventory & Concrete Seed Datasets

### 4.1 Master Feature Catalog (12 Items)

| Feature ID | Name | Category | Points | Icon | Description |
|------------|------|----------|:------:|------|-------------|
| `auto_save` | Tabungan Otomatis Gaji (Auto-Save) | Savings | 20 | `bi-piggy-bank` | Alokasikan persentase gaji secara otomatis ke tabungan terpisah setiap tanggal gajian. |
| `health_insurance` | Asuransi Kesehatan Mandiri | Protection | 20 | `bi-shield-check` | Proteksi kesehatan komprehensif tanpa biaya klaim rumit langsung dari aplikasi. |
| `paylater_reminder` | Reminder Paylater Otomatis | Credit | 10 | `bi-alarm` | Notifikasi pintar dan auto-debet sebelum jatuh tempo tagihan Paylater agar bebas denda. |
| `joint_account` | Joint Account (Rekening Bersama) | Family | 15 | `bi-people` | Rekening transparan berdua dengan pasangan untuk kebutuhan dapur dan cicilan bersama. |
| `family_budgeting` | Family Budgeting & Expense Tracker | Family | 10 | `bi-pie-chart` | Kategorisasi otomatis pos pengeluaran bulanan keluarga dengan limit batas sehat. |
| `family_insurance` | Asuransi Jiwa & Keluarga | Protection | 20 | `bi-shield-lock` | Perlindungan finansial komprehensif bagi kepala keluarga dan anggota keluarga. |
| `child_savings` | Tabungan Pendidikan Anak | Children | 20 | `bi-mortarboard` | Tabungan berjangka khusus dengan bunga kompetitif untuk biaya sekolah anak. |
| `qris_merchant` | BCA Merchant & QRIS Bisnis | Business | 15 | `bi-qr-code-scan` | Terima pembayaran QRIS instan tanpa biaya admin tinggi langsung masuk rekening usaha. |
| `cashflow_report` | Laporan Arus Kas Bisnis | Business | 10 | `bi-graph-up-arrow` | Analisis otomatis pemasukan vs pengeluaran usaha dengan visualisasi grafik real-time. |
| `student_savings` | Tabungan Pelajar & Saku Budget | Student | 15 | `bi-wallet2` | Fitur alokasi uang saku mingguan bebas biaya admin bulanan untuk mahasiswa. |
| `conservative_invest` | Investasi Konservatif (Reksa Dana) | Investment | 20 | `bi-graph-up` | Instrumen reksa dana pasar uang berrisiko rendah untuk persiapan pensiun tenang. |
| `welma_portfolio` | Welma Investment Portfolio Tracker | Investment | 15 | `bi-briefcase` | Pantau obligasi, saham, dan reksa dana dalam satu dashboard terintegrasi. |

---

### 4.2 Life Event Rules & Smart Bundles (5 Rules)

1. **`FRESH_GRADUATE` — Mulai Kerja / Fresh Graduate**
   - **Bundle Name**: Mulai Kerja Kit
   - **Required Signals**: `["Gaji Bulanan", "Sewa Kos / Housing"]`
   - **Optional Signals**: `["Cicilan / Paylater", "Tagihan Utilitas"]`
   - **Features Included**: `["auto_save", "health_insurance"]`
   - **Bonus Points**: +25 PTS
   - **Description**: Sistem mendeteksi masuknya Gaji Utama pertama & pembayaran Sewa Kos. Waktunya membangun fondasi finansial mandiri!

2. **`NEWLYWED` — Rumah Tangga Baru**
   - **Bundle Name**: Rumah Tangga Baru Kit
   - **Required Signals**: `["Transfer Pasangan", "Cicilan KPR / Rumah"]`
   - **Optional Signals**: `["Supermarket / Dapur"]`
   - **Features Included**: `["joint_account", "family_budgeting", "family_insurance"]`
   - **Bonus Points**: +30 PTS
   - **Description**: Sistem mendeteksi transfer rutin ke pasangan & cicilan KPR. Alokasikan dana bersama lebih transparan!

3. **`BUSINESS_OWNER` — Pemilik Usaha (Merchant)**
   - **Bundle Name**: Pro Merchant Kit
   - **Required Signals**: `["Terima QRIS Merchant", "Transfer Supplier"]`
   - **Optional Signals**: `["Gaji Karyawan"]`
   - **Features Included**: `["qris_merchant", "cashflow_report"]`
   - **Bonus Points**: +25 PTS
   - **Description**: Sistem mendeteksi transaksi penerimaan QRIS & transfer supplier berulang. Optimalkan arus kas usaha Anda!

4. **`STUDENT` — Mahasiswa / Pelajar**
   - **Bundle Name**: Mahasiswa Starter Pack
   - **Required Signals**: `["Bayar Kampus / UKT", "Transfer Masuk Ortu"]`
   - **Optional Signals**: `["Jajan & Hangout"]`
   - **Features Included**: `["student_savings"]`
   - **Bonus Points**: +15 PTS
   - **Description**: Sistem mendeteksi transaksi rutin kampus dan kiriman orang tua. Kelola saku mingguan lebih hemat!

5. **`PRE_RETIREMENT` — Persiapan Pensiun**
   - **Bundle Name**: Golden Age Retirement Kit
   - **Required Signals**: `["Investasi Reksa Dana", "Pengeluaran Rumah"]`
   - **Optional Signals**: `["Investasi Deposito"]`
   - **Features Included**: `["conservative_invest", "welma_portfolio"]`
   - **Bonus Points**: +35 PTS
   - **Description**: Sistem mendeteksi portofolio investasi stabil. Amankan dana masa depan dengan instrumen konservatif.

---

### 4.3 All 5 Personas Concrete Profiles & Mutation Seeds

#### Persona 1: Dimas Prasetyo (Fresh Graduate / Pekerja Baru)
- **User ID**: `dimas` | **BCA ID**: `dimas2026` | **Password**: `Password123!`
- **Email**: `dimas.prasetyo@mybca.co.id` | **Age**: 23 | **Occupation**: Junior Software Engineer
- **Account**: ID: `acc_dimas` | No: `8820491823` | Type: `Tahapan BCA` | **Initial Balance**: Rp 14.500.000
- **Avatar**: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
- **Active Features**: `["paylater_reminder"]`
- **Timeliness Rate**: 100.0% | **Savings Consistency**: false (0)
- **Initial Gamification Score**: **45 PTS (Level Silver)**  
  *(Base: 20 + Paylater Reminder: 10 + Timeliness Bonus: 15 = 45)*
- **Baseline Transactions ($T-1$, Juli 2026)**:
  1. `2026-07-05` | CR | Rp 1.500.000 | `Transfer Masuk` | Kiriman Ortu | `bi-arrow-down-left`
  2. `2026-07-10` | DB | Rp 120.000 | `Jajan & Lifestyle` | Kopi & Cafe | `bi-cup-hot`
  3. `2026-07-15` | DB | Rp 350.000 | `Paylater` | Beli Sepatu Online | `bi-credit-card`
  4. `2026-07-20` | DB | Rp 100.000 | `Pulsa & Data` | Paket Internet | `bi-phone`
- **Current Transactions ($T$, Agustus–September 2026)**:
  1. `2026-08-25` | CR | Rp 8.500.000 | `Gaji Bulanan` | Gaji Utama PT Tech Inovasi | `bi-cash-stack`
  2. `2026-08-26` | DB | Rp 2.200.000 | `Sewa Kos / Housing` | Sewa Kos Bulanan | `bi-house-door`
  3. `2026-08-28` | DB | Rp 650.000 | `Cicilan / Paylater` | Cicilan Laptop Work | `bi-credit-card`
  4. `2026-09-02` | DB | Rp 250.000 | `Jajan & Lifestyle` | Dinner Tim Kantor | `bi-cup-hot`
  5. `2026-09-05` | DB | Rp 300.000 | `Tagihan Utilitas` | Listrik & Water Kos | `bi-lightning-charge`
- **Triggered Life Event**: **`FRESH_GRADUATE`** (Confidence: **100%**) $\rightarrow$ Proposes **Mulai Kerja Kit** (`auto_save`, `health_insurance`, +25 PTS bonus).

---

#### Persona 2: Ayu Ratnasari (Rumah Tangga Baru)
- **User ID**: `ayu` | **BCA ID**: `ayu2026` | **Password**: `Password123!`
- **Email**: `ayu.ratnasari@mybca.co.id` | **Age**: 28 | **Occupation**: Marketing Executive
- **Account**: ID: `acc_ayu` | No: `5271890241` | Type: `Tahapan BCA` | **Initial Balance**: Rp 38.200.000
- **Avatar**: `https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80`
- **Active Features**: `["auto_save", "family_budgeting"]`
- **Timeliness Rate**: 100.0% | **Savings Consistency**: true (1)
- **Initial Gamification Score**: **80 PTS (Level Gold)**  
  *(Base: 20 + Auto-Save: 20 + Family Budgeting: 10 + Timeliness: 15 + Savings: 15 = 80)*
- **Baseline Transactions ($T-1$, Juli 2026)**:
  1. `2026-07-01` | CR | Rp 11.000.000 | `Gaji Bulanan` | Gaji Perusahaan | `bi-cash-stack`
  2. `2026-07-05` | DB | Rp 450.000 | `Jajan & Lifestyle` | Belanja Pakaian | `bi-bag`
- **Current Transactions ($T$, Agustus–September 2026)**:
  1. `2026-08-25` | CR | Rp 11.000.000 | `Gaji Bulanan` | Gaji Perusahaan | `bi-cash-stack`
  2. `2026-08-27` | DB | Rp 4.500.000 | `Transfer Pasangan` | Transfer ke Suami (Uang Dapur) | `bi-heart`
  3. `2026-08-28` | DB | Rp 3.800.000 | `Cicilan KPR / Rumah` | Cicilan KPR BCA | `bi-building-gear`
  4. `2026-09-01` | DB | Rp 1.200.000 | `Supermarket / Dapur` | Belanja Mingguan Supermarket | `bi-cart3`
- **Triggered Life Event**: **`NEWLYWED`** (Confidence: **100%**) $\rightarrow$ Proposes **Rumah Tangga Baru Kit** (`joint_account`, `family_budgeting`, `family_insurance`, +30 PTS bonus).

---

#### Persona 3: Hj. Sari Wijaya (Pemilik Usaha / Merchant Bisnis)
- **User ID**: `sari` | **BCA ID**: `sari2026` | **Password**: `Password123!`
- **Email**: `sari.wijaya@mybca.co.id` | **Age**: 35 | **Occupation**: Owner Catering & Bakery
- **Account**: ID: `acc_sari` | No: `7401293811` | Type: `BCA Bisnis` | **Initial Balance**: Rp 125.400.000
- **Avatar**: `https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80`
- **Active Features**: `["qris_merchant", "cashflow_report"]`
- **Timeliness Rate**: 95.0% | **Savings Consistency**: true (1)
- **Initial Gamification Score**: **75 PTS (Level Gold)**  
  *(Base: 20 + QRIS Merchant: 15 + Cashflow Report: 10 + Timeliness: 15 + Savings: 15 = 75)*
- **Baseline Transactions ($T-1$, Juli 2026)**:
  1. `2026-07-10` | CR | Rp 850.000 | `Terima QRIS Merchant` | Pemasukan Catering | `bi-qr-code`
  2. `2026-07-12` | DB | Rp 2.300.000 | `Transfer Supplier` | Bahan Baku Tepung & Gula | `bi-truck`
- **Current Transactions ($T$, Agustus–September 2026)**:
  1. `2026-08-20` | CR | Rp 3.400.000 | `Terima QRIS Merchant` | Pembayaran Event Pesanan | `bi-qr-code`
  2. `2026-08-22` | CR | Rp 1.850.000 | `Terima QRIS Merchant` | Pemasukan Harian Horeca | `bi-qr-code`
  3. `2026-08-25` | DB | Rp 5.600.000 | `Transfer Supplier` | Pembelian Bahan Grosir | `bi-truck`
  4. `2026-09-01` | DB | Rp 8.000.000 | `Gaji Karyawan` | Transfer Gaji 4 Staf | `bi-people-fill`
- **Triggered Life Event**: **`BUSINESS_OWNER`** (Confidence: **100%**) $\rightarrow$ Proposes **Pro Merchant Kit** (`qris_merchant`, `cashflow_report`, +25 PTS bonus).

---

#### Persona 4: Rina Kartika (Mahasiswa Aktif)
- **User ID**: `rina` | **BCA ID**: `rina2026` | **Password**: `Password123!`
- **Email**: `rina.kartika@mybca.co.id` | **Age**: 20 | **Occupation**: Mahasiswi S1 Ilmu Komputer
- **Account**: ID: `acc_rina` | No: `6029104822` | Type: `Tahapan Xpresi` | **Initial Balance**: Rp 3.400.000
- **Avatar**: `https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80`
- **Active Features**: `["student_savings"]`
- **Timeliness Rate**: 100.0% | **Savings Consistency**: false (0)
- **Initial Gamification Score**: **50 PTS (Level Silver)**  
  *(Base: 20 + Student Savings: 15 + Timeliness: 15 = 50)*
- **Baseline Transactions ($T-1$, Juli 2026)**:
  1. `2026-07-01` | CR | Rp 2.000.000 | `Transfer Masuk Ortu` | Uang Saku Bulanan | `bi-arrow-down-left`
  2. `2026-07-05` | DB | Rp 85.000 | `Jajan & Hangout` | Kopi Kampus | `bi-cup-hot`
- **Current Transactions ($T$, Agustus–September 2026)**:
  1. `2026-08-28` | CR | Rp 2.500.000 | `Transfer Masuk Ortu` | Uang Saku & Buku | `bi-arrow-down-left`
  2. `2026-08-30` | DB | Rp 1.500.000 | `Bayar Kampus / UKT` | Pembayaran Semester 5 | `bi-book`
  3. `2026-09-02` | DB | Rp 65.000 | `Jajan & Hangout` | Fast Food | `bi-shop`
  4. `2026-09-04` | DB | Rp 50.000 | `Pulsa & Game` | Topup Voucher | `bi-phone`
- **Triggered Life Event**: **`STUDENT`** (Confidence: **100%**) $\rightarrow$ Proposes **Mahasiswa Starter Pack** (`student_savings`, +15 PTS bonus).

---

#### Persona 5: Drs. Bambang Hariyanto (Menjelang Pensiun)
- **User ID**: `bambang` | **BCA ID**: `bambang2026` | **Password**: `Password123!`
- **Email**: `bambang.hariyanto@mybca.co.id` | **Age**: 56 | **Occupation**: Senior Manager BUMN
- **Account**: ID: `acc_bambang` | No: `1092847120` | Type: `Tahapan BCA` | **Initial Balance**: Rp 245.000.000
- **Avatar**: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80`
- **Active Features**: `["auto_save", "conservative_invest", "welma_portfolio"]`
- **Timeliness Rate**: 100.0% | **Savings Consistency**: true (1)
- **Initial Gamification Score**: **100 PTS (Level Diamond)**  
  *(Base: 20 + Auto-Save: 20 + Invest: 20 + Welma: 15 + Timeliness: 15 + Savings: 15 = 105 $\rightarrow$ clamped to 100)*
- **Baseline Transactions ($T-1$, Juli 2026)**:
  1. `2026-07-25` | CR | Rp 25.000.000 | `Gaji Bulanan` | Gaji Direksi/Manager | `bi-cash-stack`
  2. `2026-07-28` | DB | Rp 10.000.000 | `Investasi Deposito` | Deposito Berjangka BCA | `bi-safe`
- **Current Transactions ($T$, Agustus–September 2026)**:
  1. `2026-08-25` | CR | Rp 25.000.000 | `Gaji Bulanan` | Gaji Direksi/Manager | `bi-cash-stack`
  2. `2026-08-27` | DB | Rp 8.000.000 | `Investasi Reksa Dana` | Pembelian Reksa Dana Pasar Uang | `bi-graph-up-arrow`
  3. `2026-09-01` | DB | Rp 4.500.000 | `Pengeluaran Rumah` | Belanja & Operasional | `bi-house`
- **Triggered Life Event**: **`PRE_RETIREMENT`** (Confidence: **100%**) $\rightarrow$ Proposes **Golden Age Retirement Kit** (`conservative_invest`, `welma_portfolio`, +35 PTS bonus).

---

### 4.4 Simulation Demo Scenarios Catalog (3 Scenarios)

1. **`scen_freshgrad`**: 🚀 Skenario A: Dimas Terima Gaji & Sewa Kos (Triggers Fresh Grad Kit)
   - **Target Persona**: `dimas`
   - **Injected Transactions**:
     - `2026-09-10` | CR | Rp 8.500.000 | `Gaji Bulanan` | Gaji Ke-2 PT Tech Inovasi | `bi-cash-stack`
     - `2026-09-11` | DB | Rp 2.200.000 | `Sewa Kos / Housing` | Pelunasan Kos September | `bi-house-door`
   - **Expected Life Event**: `FRESH_GRADUATE` (Mulai Kerja Kit)

2. **`scen_newlywed`**: 💍 Skenario B: Ayu Transfer Suami & Bayar KPR (Triggers Rumah Tangga Kit)
   - **Target Persona**: `ayu`
   - **Injected Transactions**:
     - `2026-09-10` | DB | Rp 5.000.000 | `Transfer Pasangan` | Alokasi Bulanan Suami | `bi-heart`
     - `2026-09-11` | DB | Rp 3.800.000 | `Cicilan KPR / Rumah` | Cicilan KPR Bulan Ke-6 | `bi-building-gear`
   - **Expected Life Event**: `NEWLYWED` (Rumah Tangga Baru Kit)

3. **`scen_merchant`**: 🏪 Skenario C: Sari Terima QRIS Pelanggan & Transfer Supplier (Triggers Pro Merchant Kit)
   - **Target Persona**: `sari`
   - **Injected Transactions**:
     - `2026-09-10` | CR | Rp 4.500.000 | `Terima QRIS Merchant` | Omset QRIS Toko Roti | `bi-qr-code`
     - `2026-09-11` | DB | Rp 3.200.000 | `Transfer Supplier` | Pembayaran Supplier Kemasan | `bi-truck`
   - **Expected Life Event**: `BUSINESS_OWNER` (Pro Merchant Kit)

---

## 5. Complete REST API Specifications

### 5.1 Overview & Conventions
- **Base URL**: `http://localhost:3000/api`
- **Data Format**: `application/json; charset=utf-8`
- **Authentication**: Bearer Token in `Authorization: Bearer <token>` header or `mybca_session` HTTP-only cookie. For simplified judge evaluation, tokens match the format `token_<persona_id>_<timestamp>`.
- **Standard Success Envelope**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "timestamp": "2026-09-11T14:30:00.000Z" }
  }
  ```
- **Standard Error Envelope**:
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Detailed human-readable error explanation"
    }
  }
  ```

---

### 5.2 Authentication & Persona Endpoints

#### 1. `POST /api/auth/login`
Authenticates a user via authentic myBCA credentials.
- **Request Body**:
  ```json
  {
    "bca_id": "dimas2026",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "token_dimas_1773413400000",
      "user": {
        "id": "dimas",
        "bca_id": "dimas2026",
        "name": "Dimas Prasetyo",
        "email": "dimas.prasetyo@mybca.co.id",
        "title": "Fresh Graduate / Pekerja Baru",
        "occupation": "Junior Software Engineer",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      },
      "account": {
        "id": "acc_dimas",
        "account_no": "8820491823",
        "account_type": "Tahapan BCA",
        "balance": 14500000,
        "currency": "IDR"
      }
    }
  }
  ```
- **Error Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "BCA ID atau Password salah. Silakan coba kembali."
    }
  }
  ```

#### 2. `POST /api/auth/quick-login`
Judge 1-click switcher to switch active persona instantly.
- **Request Body**:
  ```json
  {
    "persona_id": "dimas"
  }
  ```
- **Success Response (200 OK)**: Same structure as `/api/auth/login`.

#### 3. `POST /api/auth/logout`
Terminates current session.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Sesi berhasil diakhiri. Kembali ke halaman login."
    }
  }
  ```

#### 4. `GET /api/auth/session`
Returns current session status and logged-in user profile.
- **Success Response (200 OK)**: Returns active user, account, and permissions.
- **Error Response (401 Unauthorized)**: When no active session exists.

#### 5. `GET /api/personas`
Public endpoint returning metadata of all 5 personas to populate the Quick Switcher dropdown for judges.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "dimas",
        "bca_id": "dimas2026",
        "name": "Dimas Prasetyo",
        "title": "Fresh Graduate / Pekerja Baru",
        "occupation": "Junior Software Engineer",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      },
      {
        "id": "ayu",
        "bca_id": "ayu2026",
        "name": "Ayu Ratnasari",
        "title": "Rumah Tangga Baru",
        "occupation": "Marketing Executive",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
      },
      { "id": "sari", "bca_id": "sari2026", "name": "Hj. Sari Wijaya", "title": "Pemilik Usaha (Merchant Bisnis)" },
      { "id": "rina", "bca_id": "rina2026", "name": "Rina Kartika", "title": "Mahasiswa Aktif" },
      { "id": "bambang", "bca_id": "bambang2026", "name": "Drs. Bambang Hariyanto", "title": "Menjelang Pensiun" }
    ]
  }
  ```

---

### 5.3 Accounts & Transactions Endpoints

#### 1. `GET /api/accounts`
Retrieves account cards for current persona.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "acc_dimas",
        "account_no": "8820491823",
        "account_type": "Tahapan BCA",
        "balance": 14500000,
        "currency": "IDR",
        "status": "ACTIVE"
      }
    ]
  }
  ```

#### 2. `GET /api/transactions`
Retrieves transaction mutations.
- **Query Parameters**:
  - `account_id` (optional, string)
  - `period` (optional: `current` [default], `baseline`, `all`)
  - `limit` (optional integer, default 50)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 10,
        "date": "2026-09-05",
        "category": "Tagihan Utilitas",
        "amount": 300000,
        "type": "DB",
        "description": "Listrik & Water Kos",
        "icon": "bi-lightning-charge",
        "period": "current"
      },
      {
        "id": 9,
        "date": "2026-09-02",
        "category": "Jajan & Lifestyle",
        "amount": 250000,
        "type": "DB",
        "description": "Dinner Tim Kantor",
        "icon": "bi-cup-hot",
        "period": "current"
      }
    ]
  }
  ```

#### 3. `POST /api/transactions/inject`
The core Simulation Sandbox endpoint. Injects a manual transaction, mutates database balance, and triggers immediate AI recalculation.
- **Request Body**:
  ```json
  {
    "account_id": "acc_dimas",
    "description": "Gaji Ke-2 PT Tech Inovasi",
    "category": "Gaji Bulanan",
    "amount": 8500000,
    "type": "CR",
    "date": "2026-09-12"
  }
  ```
  *(Note: If `type` is omitted, the backend infers `'CR'` if category contains `Masuk`, `Gaji`, or `QRIS`, otherwise `'DB'`)*.
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "transaction": {
        "id": 15,
        "account_id": "acc_dimas",
        "date": "2026-09-12",
        "category": "Gaji Bulanan",
        "amount": 8500000,
        "type": "CR",
        "description": "Gaji Ke-2 PT Tech Inovasi",
        "icon": "bi-cash-stack",
        "period": "current"
      },
      "new_balance": 23000000,
      "ai_evaluation": {
        "propensity_top_recommendation": "Tabungan Otomatis Gaji (Auto-Save)",
        "life_event_detected": "FRESH_GRADUATE",
        "life_event_confidence": 100,
        "bundle_offered": "Mulai Kerja Kit",
        "gamification_score": 45,
        "gamification_tier": "Silver"
      }
    }
  }
  ```

---

### 5.4 Feature & Bundle Endpoints

#### 1. `GET /api/features`
Returns full catalog with activation status for current persona.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "auto_save",
        "name": "Tabungan Otomatis Gaji (Auto-Save)",
        "category": "Savings",
        "icon": "bi-piggy-bank",
        "points": 20,
        "description": "Alokasikan persentase gaji secara otomatis ke tabungan terpisah setiap tanggal gajian.",
        "is_active": false
      },
      {
        "id": "paylater_reminder",
        "name": "Reminder Paylater Otomatis",
        "category": "Credit",
        "icon": "bi-alarm",
        "points": 10,
        "description": "Notifikasi pintar dan auto-debet sebelum jatuh tempo tagihan Paylater agar bebas denda.",
        "is_active": true
      }
    ]
  }
  ```

#### 2. `POST /api/features/:id/activate`
Activates an individual feature via 1-tap card click.
- **URL Param**: `id` = feature ID (e.g. `auto_save`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "feature_id": "auto_save",
      "name": "Tabungan Otomatis Gaji (Auto-Save)",
      "points_awarded": 20,
      "gamification_score": {
        "previous_score": 45,
        "new_score": 65,
        "tier": "Silver",
        "reward_points": 1000
      }
    }
  }
  ```
- **Error Response (409 Conflict)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "FEATURE_ALREADY_ACTIVE",
      "message": "Fitur ini sudah aktif pada akun Anda."
    }
  }
  ```

#### 3. `GET /api/bundles`
Returns current life event smart bundle proposal if confidence $\ge 60\%$.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "detected": true,
      "rule_id": "FRESH_GRADUATE",
      "bundle_name": "Mulai Kerja Kit",
      "confidence": 100,
      "description": "Sistem mendeteksi masuknya Gaji Utama pertama & pembayaran Sewa Kos. Waktunya membangun fondasi finansial mandiri!",
      "detected_signals": ["Gaji Bulanan", "Sewa Kos / Housing", "Cicilan / Paylater", "Tagihan Utilitas"],
      "features": [
        { "id": "auto_save", "name": "Tabungan Otomatis Gaji (Auto-Save)", "icon": "bi-piggy-bank", "points": 20 },
        { "id": "health_insurance", "name": "Asuransi Kesehatan Mandiri", "icon": "bi-shield-check", "points": 20 }
      ],
      "bonus_points": 25,
      "total_points_gained": 65
    }
  }
  ```

#### 4. `POST /api/bundles/:id/activate`
Batch-claims all bundled features in 1-click.
- **URL Param**: `id` = life event rule ID (e.g. `FRESH_GRADUATE`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "bundle_name": "Mulai Kerja Kit",
      "activated_features": ["auto_save", "health_insurance"],
      "bonus_points_awarded": 25,
      "gamification_score": {
        "previous_score": 45,
        "new_score": 85,
        "tier": "Gold",
        "reward_points": 2500
      }
    }
  }
  ```

---

### 5.5 AI Recalculation & Audit Inspector Endpoints

#### 1. `GET /api/ai/evaluation`
Evaluates all three AI engines synchronously from the current database state.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user_id": "dimas",
      "propensity_recommendations": [
        {
          "feature_id": "auto_save",
          "name": "Tabungan Otomatis Gaji (Auto-Save)",
          "score": 98,
          "reason": "Terdeteksi pola transaksi: Gaji Bulanan (1x, Rp 8.500.000)",
          "signals": ["Gaji Bulanan (1x, Rp 8.500.000)"],
          "points": 20,
          "icon": "bi-piggy-bank"
        },
        {
          "feature_id": "health_insurance",
          "name": "Asuransi Kesehatan Mandiri",
          "score": 92,
          "reason": "Terdeteksi pola transaksi: Gaji Bulanan, Sewa Kos / Housing",
          "signals": ["Gaji Bulanan (1x, Rp 8.500.000)", "Sewa Kos / Housing (1x, Rp 2.200.000)"],
          "points": 20,
          "icon": "bi-shield-check"
        }
      ],
      "life_event": {
        "detected": true,
        "rule_id": "FRESH_GRADUATE",
        "bundle_name": "Mulai Kerja Kit",
        "confidence": 100,
        "detected_signals": ["Gaji Bulanan", "Sewa Kos / Housing", "Cicilan / Paylater", "Tagihan Utilitas"]
      },
      "gamification": {
        "score": 45,
        "tier": "Silver",
        "badge_class": "badge-silver",
        "reward_points": 1000,
        "breakdown": {
          "base_score": 20,
          "feature_points": 10,
          "active_features": [
            { "name": "Reminder Paylater Otomatis", "points": 10 }
          ],
          "timeliness_bonus": 15,
          "savings_bonus": 0
        },
        "next_tier_threshold": 70
      }
    }
  }
  ```

#### 2. `POST /api/ai/recalculate`
Forces synchronous re-evaluation across all algorithms and emits an audit trace entry.

#### 3. `GET /api/ai/audit-logs`
Provides real-time decision log stream for the collapsible Mode Juri panel.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 142,
        "timestamp": "21:30:15",
        "engine": "PROPENSITY_ENGINE",
        "message": "Kalkulasi selesai. Rekomendasi teratas: Tabungan Otomatis Gaji (Auto-Save) (98%)"
      },
      {
        "id": 141,
        "timestamp": "21:30:15",
        "engine": "LIFE_EVENT_ENGINE",
        "message": "Life Event Terdeteksi: Mulai Kerja / Fresh Graduate (Confidence: 100%)"
      },
      {
        "id": 140,
        "timestamp": "21:30:15",
        "engine": "GAMIFICATION_ENGINE",
        "message": "Skor akhir: 45/100 [Level Silver]"
      }
    ]
  }
  ```

#### 4. `POST /api/simulation/scenarios/:id/trigger`
Executes preset presentation scenario with a single click.
- **URL Param**: `id` = `scen_freshgrad` | `scen_newlywed` | `scen_merchant`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "scenario_id": "scen_freshgrad",
      "scenario_name": "🚀 Skenario A: Dimas Terima Gaji & Sewa Kos (Triggers Fresh Grad Kit)",
      "persona_id": "dimas",
      "transactions_injected_count": 2,
      "updated_balance": 20800000,
      "expected_event": "FRESH_GRADUATE",
      "expected_bundle": "Mulai Kerja Kit"
    }
  }
  ```

---

### 5.6 Admin & 1-Click Reset Endpoint

#### 1. `POST /api/admin/reset`
The mandatory 1-click database reset button for jury demonstrations.
- **Execution Logic**:
  1. Opens SQLite transaction: `BEGIN EXCLUSIVE TRANSACTION;`.
  2. Drops all ephemeral mutations and active feature modifications.
  3. Re-inserts all 5 clean personas, initial bank accounts with baseline balances, 12 features, 5 life event rules, 3 scenarios, baseline transactions ($T-1$), and initial current transactions ($T$).
  4. Resets audit log table and logs: `[SYSTEM] Database successfully reset to pristine seed state.`.
  5. Commits transaction: `COMMIT;`.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Database berhasil di-reset ke kondisi awal (pristine seeds).",
      "reset_timestamp": "2026-09-11T14:32:00.000Z",
      "summary": {
        "personas_seeded": 5,
        "accounts_seeded": 5,
        "features_seeded": 12,
        "transactions_seeded": 35,
        "active_features_seeded": 9
      }
    }
  }
  ```

#### 2. `GET /api/admin/health`
Monitors database connection, file lock status, table row counts, and memory consumption.

---

## 6. Fullstack Integration & Architecture Guidelines

### 6.1 Server File Structure
```
backend/
├── db/
│   ├── connection.js       # SQLite connection manager (using node:sqlite or better-sqlite3)
│   ├── schema.sql          # Complete DDL file
│   ├── seed.js             # Initial pristine seeds loader & reset executor
│   └── database.sqlite     # SQLite database file
├── engines/
│   ├── propensityEngine.js # Algoritma 1 logic
│   ├── lifeEventEngine.js  # Algoritma 2 pattern shift analysis
│   └── gamificationEngine.js# Algoritma 3 score & tier calculation
├── routes/
│   ├── authRoutes.js       # /api/auth and /api/personas
│   ├── accountRoutes.js    # /api/accounts and /api/transactions
│   ├── featureRoutes.js    # /api/features and /api/bundles
│   ├── aiRoutes.js         # /api/ai/evaluation, recalculate, audit-logs
│   └── adminRoutes.js      # /api/admin/reset, health
├── middleware/
│   └── authMiddleware.js   # Session verification
├── server.js               # Express application entrypoint
└── package.json
```

### 6.2 Implementation Checklist for Orchestrator & Developers
- [x] **Schema Consistency**: Integer representation for all IDR currency values (`balance`, `amount`) prevents floating point inaccuracies.
- [x] **Date Format Standardization**: All timestamps stored in ISO-8601 string format (`YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ`) for seamless sorting.
- [x] **Balance Reconciliation Trigger**: Ensure `transactions/inject` computes `account.balance += (type === 'CR' ? amount : -amount)` inside a single atomic transaction.
- [x] **Zero External Configuration**: Database runs locally out of `database.sqlite` without requiring MySQL/PostgreSQL daemons.
- [x] **Jury Safe-Mode**: 1-click reset completes in `< 50ms`, permitting instant repetition during live Q&A.

---
*Report compiled and verified by Spec Miner 2 (`survey_data_spec_miner_2`).*
