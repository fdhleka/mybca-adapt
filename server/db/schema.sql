-- myBCA ADAPT Relational Database DDL Specification
-- Target: SQLite 3 with WAL Mode and Foreign Key Enforcement

PRAGMA foreign_keys = ON;

-- 1. Users / Personas Master Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                             -- e.g. 'dimas', 'ayu', 'sari', 'rina', 'bambang'
    bca_id TEXT UNIQUE NOT NULL,                     -- e.g. 'dimas2026'
    password TEXT NOT NULL,                          -- Plaintext/hash for demo authentication
    name TEXT NOT NULL,                              -- e.g. 'Dimas Prasetyo'
    email TEXT NOT NULL,                             -- e.g. 'dimas.prasetyo@mybca.co.id'
    age INTEGER NOT NULL,                            -- e.g. 23
    title TEXT NOT NULL,                             -- e.g. 'Fresh Graduate / Pekerja Baru'
    occupation TEXT NOT NULL,                        -- e.g. 'Junior Software Engineer'
    avatar_url TEXT NOT NULL,                        -- Avatar image path/url
    timeliness_rate REAL NOT NULL DEFAULT 100.0,     -- e.g. 100.0 (% on-time bill payments)
    savings_consistency INTEGER NOT NULL DEFAULT 0,  -- 1 = true, 0 = false
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bank Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,                             -- e.g. 'acc_dimas'
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_no TEXT UNIQUE NOT NULL,                 -- e.g. '8820491823'
    account_type TEXT NOT NULL,                      -- e.g. 'Tahapan BCA', 'BCA Bisnis', 'Tahapan Xpresi'
    currency TEXT NOT NULL DEFAULT 'IDR',
    balance INTEGER NOT NULL DEFAULT 0,              -- Nominal balance in IDR (integer)
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DORMANT', 'BLOCKED')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Features Master Catalog (12 Items)
CREATE TABLE IF NOT EXISTS features (
    id TEXT PRIMARY KEY,                             -- e.g. 'auto_save'
    name TEXT NOT NULL,                              -- e.g. 'Tabungan Otomatis Gaji (Auto-Save)'
    category TEXT NOT NULL,                          -- e.g. 'Savings', 'Protection', 'Credit', etc.
    icon TEXT NOT NULL,                              -- Bootstrap Icon class e.g. 'bi-piggy-bank'
    points INTEGER NOT NULL DEFAULT 10,              -- Gamification points: 10, 15, 20
    description TEXT NOT NULL                        -- Feature explanation
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
    date TEXT NOT NULL,                              -- Format: 'YYYY-MM-DD'
    category TEXT NOT NULL,                          -- Signals e.g. 'Gaji Bulanan', 'Sewa Kos / Housing'
    amount INTEGER NOT NULL CHECK(amount > 0),       -- Must be strictly positive
    type TEXT NOT NULL CHECK(type IN ('CR', 'DB')),  -- 'CR' = Credit/Inbound, 'DB' = Debit/Outbound
    description TEXT NOT NULL,                       -- Mutation description
    icon TEXT NOT NULL DEFAULT 'bi-receipt',         -- Bootstrap Icon class
    period TEXT NOT NULL CHECK(period IN ('baseline', 'current')), -- Baseline (T-1) vs Current (T)
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Life Event Master Rules & Smart Bundles Catalog (5 Rules)
CREATE TABLE IF NOT EXISTS life_event_rules (
    id TEXT PRIMARY KEY,                             -- e.g. 'FRESH_GRADUATE'
    name TEXT NOT NULL,                              -- e.g. 'Mulai Kerja / Fresh Graduate'
    bundle_name TEXT NOT NULL,                       -- e.g. 'Mulai Kerja Kit'
    required_signals TEXT NOT NULL,                  -- JSON string array: '["Gaji Bulanan", "Sewa Kos / Housing"]'
    optional_signals TEXT NOT NULL,                  -- JSON string array: '["Cicilan / Paylater", "Tagihan Utilitas"]'
    features_to_bundle TEXT NOT NULL,                -- JSON string array: '["auto_save", "health_insurance"]'
    bonus_points INTEGER NOT NULL DEFAULT 25,        -- Bonus points awarded on bundle claim
    description TEXT NOT NULL                        -- Narrative explanation
);

-- 7. User Detected Life Events History
CREATE TABLE IF NOT EXISTS user_life_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_rule_id TEXT NOT NULL REFERENCES life_event_rules(id) ON DELETE CASCADE,
    confidence INTEGER NOT NULL,                     -- Percentage 0 - 100
    detected_signals TEXT NOT NULL,                  -- JSON string array
    status TEXT NOT NULL DEFAULT 'DETECTED' CHECK(status IN ('DETECTED', 'ACTIVATED', 'DISMISSED')),
    detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_at TEXT                                -- Timestamp when user claimed bundle
);

-- 8. Audit Engine Trace Logs (Mode Juri Inspector)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    engine TEXT NOT NULL,                            -- 'PROPENSITY_ENGINE', 'LIFE_EVENT_ENGINE', etc.
    message TEXT NOT NULL,
    payload TEXT,                                    -- Optional JSON string
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Preset Simulation Scenarios Catalog (3 Scenarios)
CREATE TABLE IF NOT EXISTS simulation_scenarios (
    id TEXT PRIMARY KEY,                             -- e.g. 'scen_freshgrad'
    name TEXT NOT NULL,
    persona_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expected_event TEXT NOT NULL,
    expected_bundle TEXT NOT NULL,
    payload_transactions TEXT NOT NULL               -- JSON string array of transactions to inject
);

-- 10. Vouchers Master Table (Admin Configured)
CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,                             -- e.g. 'vouch_indomaret_50k'
    code TEXT UNIQUE NOT NULL,                       -- e.g. 'BCA-INDO-50K'
    title TEXT NOT NULL,                             -- e.g. 'Voucher Belanja Indomaret Rp 50.000'
    merchant TEXT NOT NULL,                          -- e.g. 'Indomaret'
    category TEXT NOT NULL,                          -- e.g. 'Shopping', 'F&B', 'Investment', 'Lifestyle'
    icon TEXT NOT NULL DEFAULT 'bi-gift',           -- Bootstrap icon
    reward_value INTEGER NOT NULL,                   -- e.g. 50000
    reward_type TEXT NOT NULL CHECK(reward_type IN ('DISCOUNT', 'CASHBACK', 'POINTS')),
    target_type TEXT NOT NULL CHECK(target_type IN ('MIN_HEALTH_SCORE', 'CATEGORY_TX_COUNT', 'MIN_SAVINGS_ALLOC', 'ACTIVE_FEATURE_COUNT', 'TOTAL_TX_COUNT', 'MIN_SPEND_AMOUNT')),
    target_value INTEGER NOT NULL,                   -- e.g. 70 (score), 2 (count), 500000 (IDR savings), 3 (features)
    target_category TEXT,                            -- optional, e.g. 'Belanja Kebutuhan Pokok'
    description TEXT NOT NULL,                       -- explanation of reward and condition
    expiry_date TEXT NOT NULL,                       -- e.g. '2026-12-31'
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. User Claimed Vouchers Table
CREATE TABLE IF NOT EXISTS user_vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    voucher_id TEXT NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'CLAIMED' CHECK(status IN ('CLAIMED', 'USED')),
    claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TEXT,
    UNIQUE(user_id, voucher_id)
);

-- Performance Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_period ON transactions(user_id, period);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_user_features_user ON user_features(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_user ON user_vouchers(user_id);

