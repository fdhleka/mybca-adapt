# Test Infrastructure & Coverage Specification
**myBCA ADAPT — Automated Opaque-Box End-to-End (E2E) Test Suite**

**Author**: E2E Test Writer (`e2e_test_writer_1`)  
**Target Environment**: Node.js v24.14.0 (Windows PowerShell / Cross-Platform)  
**Test Runner Location**: `tests/e2e_runner.js`  
**Execution Command**: `node tests/e2e_runner.js`  

---

## 1. Executive Summary

The **myBCA ADAPT E2E Test Suite** provides a 100% opaque-box, requirement-driven, automated validation framework for the entire fullstack simulation platform. It treats the running application strictly as an external black box accessed solely via HTTP REST contracts, validating real database persistence, live AI recalculation cascades, adversarial input boundaries, pairwise feature interactions, and multi-step persona journeys.

### Key Architectural Strengths:
1. **Zero External Test Dependencies**: Built using native Node.js v24 capabilities (`fetch`, `child_process`, `assert`), eliminating fragile testing frameworks or browser driver overhead.
2. **Auto-Spawning & Self-Healing**: Automatically probes if the backend server is running on `http://localhost:3000`. If offline, the runner automatically spawns `node server/server.js`, polls until ready, executes all test suites, and gracefully terminates the process upon completion.
3. **Strict Test Isolation & Idempotency**: Leverages the atomic 1-click database reset endpoint (`POST /api/admin/reset`) before every test suite and between mutating operations, guaranteeing complete independence and deterministic reproducibility.
4. **Authoritative Expected Output Derivation**: Every single assertion derives directly from documented project requirements (`ORIGINAL_REQUEST.md`), interface contracts (`PROJECT.md`), and mathematical formulas (`prototype/algorithms.js`, `prototype/seed-data.js`).

---

## 2. 4-Tier Test Architecture

The test suite is partitioned into four distinct tiers:

```
+-------------------------------------------------------------------------------+
|                       myBCA ADAPT E2E Test Framework                          |
+-------------------------------------------------------------------------------+
|                                                                               |
|  [Tier 1] Feature Coverage (10 Areas, >=5 Tests Each, 51 Total)               |
|   ├── Auth (Login)         ├── Accounts & Balance      ├── Algoritma 1 AI     |
|   ├── Quick Switcher       ├── Transactions History    ├── Algoritma 2 Bundle |
|   ├── Session & Logout     ├── 1-Click DB Reset        ├── Algoritma 3 Score  |
|                                                        └── Simulation Inject  |
|                                                                               |
|  [Tier 2] Boundary & Corner Cases (5 Areas, >=5 Tests Each, 28 Total)         |
|   ├── Auth & Credentials Security Boundary                                    |
|   ├── Injection Boundary, Negative Amounts & SQLi/XSS Sanitization            |
|   ├── Feature Activation Duplicates & Missing Catalogs                        |
|   ├── Life Event Confidence Thresholds (<60% vs >=60%)                        |
|   └── Gamification Clamping (0-100) & Tier Cutoffs                            |
|                                                                               |
|  [Tier 3] Cross-Feature Combinations (Pairwise Integration Flows, 5 Flows)    |
|   ├── Persona Isolation & Multi-Tenant State Independence                     |
|   ├── Transaction Injection -> Balance Mutation -> AI Cascade                 |
|   ├── 1-Click Bundle Claim -> Multiple Activations -> Tier Upgrade            |
|   ├── State Mutation -> 1-Click DB Reset Reversion                            |
|   └── Simulation Preset -> Life Event Trigger -> Mode Juri Audit Trail        |
|                                                                               |
|  [Tier 4] Real-World Persona Journeys (5 Full Lifecycles, 5 Journeys)         |
|   ├── Persona 1: Dimas Prasetyo (Fresh Graduate / Pekerja Baru)               |
|   ├── Persona 2: Ayu Ratnasari (Rumah Tangga Baru)                            |
|   ├── Persona 3: Hj. Sari Wijaya (Pemilik Usaha / Merchant Bisnis)            |
|   ├── Persona 4: Rina Kartika (Mahasiswa Aktif)                               |
|   └── Persona 5: Drs. Bambang Hariyanto (Menjelang Pensiun)                   |
+-------------------------------------------------------------------------------+
```

---

## 3. Comprehensive Traceability Matrix

### Tier 1: Feature Coverage (51 Tests across 10 Feature Areas)

| Test ID | Feature Area | Test Scenario Description | Expected Outcome | Authoritative Source |
|---|---|---|---|---|
| **T1.1.1** | Auth | Login Dimas (`dimas2026` / `Password123!`) | HTTP 200, valid token, user id = dimas | `ORIGINAL_REQUEST.md:R1` |
| **T1.1.2** | Auth | Login Ayu (`ayu2026` / `Password123!`) | HTTP 200, valid token, name = Ayu Ratnasari | `ORIGINAL_REQUEST.md:R1` |
| **T1.1.3** | Auth | Case-insensitive login (`DIMAS2026`) | HTTP 200, valid token issued | `PROJECT.md § Client Auth` |
| **T1.1.4** | Auth | Login Sari (`sari2026` / `Password123!`) | HTTP 200, valid token, Sari profile | `seed-data.js:76-85` |
| **T1.1.5** | Auth | Login Rina (`rina2026` / `Password123!`) | HTTP 200, valid token, Rina profile | `seed-data.js:99-106` |
| **T1.1.6** | Auth | Login Bambang (`bambang2026` / `Password123!`) | HTTP 200, valid token, Bambang profile | `seed-data.js:122-130` |
| **T1.2.1** | Quick Switcher | `GET /api/personas` catalog retrieval | HTTP 200, exactly 5 personas with metadata | `ORIGINAL_REQUEST.md:R1` |
| **T1.2.2** | Quick Switcher | Quick-login with `persona_id: "dimas"` | HTTP 200, instant session token issued | `PROJECT.md § Client Auth` |
| **T1.2.3** | Quick Switcher | Quick-login with `persona_id: "ayu"` | HTTP 200, Ayu session token issued | `PROJECT.md § Client Auth` |
| **T1.2.4** | Quick Switcher | Quick-login with `persona_id: "sari"` | HTTP 200, Sari session token issued | `PROJECT.md § Client Auth` |
| **T1.2.5** | Quick Switcher | Quick-login with `persona_id: "bambang"` | HTTP 200, Bambang session token issued | `PROJECT.md § Client Auth` |
| **T1.3.1** | Session | `GET /api/auth/session` with Bearer token | HTTP 200, authenticated: true | `PROJECT.md:56` |
| **T1.3.2** | Session | Session payload matches authenticated persona | User name and BCA ID match login | `PROJECT.md:56` |
| **T1.3.3** | Session | `POST /api/auth/logout` session termination | HTTP 200, success confirmation | `ORIGINAL_REQUEST.md:R1` |
| **T1.3.4** | Session | Post-logout session lookup | HTTP 401 Unauthorized | `PROJECT.md:56` |
| **T1.3.5** | Session | Repeated logout call is idempotent | HTTP 200 without server error | `survey_data_spec_miner_2` |
| **T1.4.1** | Accounts | Dimas Tahapan BCA account & initial balance | No: `8820491823`, Balance: 14.500.000 IDR | `seed-data.js:33-34` |
| **T1.4.2** | Accounts | Ayu Tahapan BCA account & initial balance | No: `5271890241`, Balance: 38.200.000 IDR | `seed-data.js:59-60` |
| **T1.4.3** | Accounts | Sari BCA Bisnis account & initial balance | No: `7401293811`, Balance: 125.400.000 IDR | `seed-data.js:82-83` |
| **T1.4.4** | Accounts | Rina Tahapan Xpresi account & initial balance | No: `6029104822`, Balance: 3.400.000 IDR | `seed-data.js:105-106` |
| **T1.4.5** | Accounts | Bambang Tahapan BCA account & initial balance | No: `1092847120`, Balance: 245.000.000 IDR | `seed-data.js:128-129` |
| **T1.5.1** | Transactions | `GET /api/transactions?period=all` | HTTP 200, 9 mutations (4 base + 5 curr) | `seed-data.js:38-50` |
| **T1.5.2** | Transactions | `GET /api/transactions?period=current` | HTTP 200, 5 current period mutations | `seed-data.js:44-50` |
| **T1.5.3** | Transactions | `GET /api/transactions?period=baseline` | HTTP 200, 4 baseline period mutations | `seed-data.js:38-43` |
| **T1.5.4** | Transactions | Mutation schema compliance | Contains id, date, amount, type, category, desc | `PROJECT.md:62` |
| **T1.5.5** | Transactions | Chronological ordering | Dates sorted descending (newest first) | `survey_data_spec_miner_2` |
| **T1.6.1** | DB Reset | `POST /api/admin/reset` execution | HTTP 200, success message returned | `ORIGINAL_REQUEST.md:R2` |
| **T1.6.2** | DB Reset | Reset latency benchmark | Execution completes promptly (< 150ms) | `PROJECT.md:24` |
| **T1.6.3** | DB Reset | Entity count restoration | Exactly 5 personas and 12 features | `PROJECT.md:23` |
| **T1.6.4** | DB Reset | Account balance restoration | All 5 account balances reset to baseline | `ORIGINAL_REQUEST.md:41` |
| **T1.6.5** | DB Reset | Active features restoration | Features reset to pristine seed sets | `ORIGINAL_REQUEST.md:41` |
| **T1.7.1** | Algoritma 1 | `GET /api/ai/evaluation` propensity feed | HTTP 200, non-empty recommendations array | `algorithms.js:26-103` |
| **T1.7.2** | Algoritma 1 | Dimas top recommendation matching | `auto_save` or `health_insurance` score >= 60% | `algorithms.js:44-45` |
| **T1.7.3** | Algoritma 1 | Contextual rationale generation | Cites detected transaction signals (e.g. Gaji) | `algorithms.js:85-88` |
| **T1.7.4** | Algoritma 1 | 1-Click Feature Activation | `POST /api/features/auto_save/activate` -> active | `ORIGINAL_REQUEST.md:R4` |
| **T1.7.5** | Algoritma 1 | Recommendation exclusion | Activated feature removed from recommendations | `algorithms.js:60` |
| **T1.8.1** | Algoritma 2 | Life event detection evaluation | HTTP 200, detected: true, confidence >= 60% | `ORIGINAL_REQUEST.md:R4` |
| **T1.8.2** | Algoritma 2 | Dimas FRESH_GRADUATE detection | rule_id = FRESH_GRADUATE, Mulai Kerja Kit | `seed-data.js:155-156` |
| **T1.8.3** | Algoritma 2 | Bundle payload structure | Lists detected signals, features, bonus pts | `algorithms.js:120-123` |
| **T1.8.4** | Algoritma 2 | 1-Click Bundle Activation | Batch-activates auto_save & health_insurance | `algorithms.js:122` |
| **T1.8.5** | Algoritma 2 | Audit log trail generation | Captures engine recalculations and user actions | `ORIGINAL_REQUEST.md:R5` |
| **T1.9.1** | Algoritma 3 | Score breakdown evaluation | Contains base_score (20), feature pts, bonuses | `algorithms.js:212-227` |
| **T1.9.2** | Algoritma 3 | Dimas initial Gamification Score | 45 PTS, Silver tier | `algorithms.js:227-255` |
| **T1.9.3** | Algoritma 3 | Ayu initial Gamification Score | 80 PTS, Gold tier | `algorithms.js:227-255` |
| **T1.9.4** | Algoritma 3 | Bambang initial Gamification Score | 100 PTS, Diamond tier (clamped from 105) | `algorithms.js:228` |
| **T1.9.5** | Algoritma 3 | Live score recalculation | Activating 20 PTS feature increases score by 20 | `ORIGINAL_REQUEST.md:47` |
| **T1.10.1**| Simulation | Manual transaction injection | `POST /api/transactions/inject` creates tx | `ORIGINAL_REQUEST.md:R5` |
| **T1.10.2**| Simulation | Credit (CR) balance increment | Balance increases by exact nominal | `PROJECT.md:63` |
| **T1.10.3**| Simulation | Debit (DB) balance decrement | Balance decreases by exact nominal | `PROJECT.md:63` |
| **T1.10.4**| Simulation | Transaction history inclusion | Injected mutation appears in current list | `ORIGINAL_REQUEST.md:45` |
| **T1.10.5**| Simulation | Preset scenario execution | `POST .../scen_freshgrad/trigger` executes txs | `seed-data.js:148-157` |

---

### Tier 2: Boundary & Corner Cases (28 Tests across 5 Boundary Areas)

| Test ID | Boundary Area | Test Scenario Description | Expected Outcome | Failure Invalidation Condition |
|---|---|---|---|---|
| **T2.1.1** | Auth Boundary | Invalid password (`WrongPassword999!`) | HTTP 401 Unauthorized | Server returns 200 or 500 |
| **T2.1.2** | Auth Boundary | Non-existent BCA ID (`ghost_user_404`) | HTTP 401 Unauthorized | Server creates user or crashes |
| **T2.1.3** | Auth Boundary | Empty credentials request body (`{}`) | HTTP 400 Bad Request | Server accepts empty body |
| **T2.1.4** | Auth Boundary | Forged Bearer token string | HTTP 401 Unauthorized | Forged token grants access |
| **T2.1.5** | Auth Boundary | Missing Authorization header | HTTP 401 Unauthorized | Unauthenticated request succeeds |
| **T2.1.6** | Auth Boundary | Quick-login with invalid persona (`superman`) | HTTP 404 Not Found | Server creates empty session |
| **T2.2.1** | Injection Boundary | Zero transaction amount (`amount: 0`) | HTTP 400 Bad Request | Zero amount saved to DB |
| **T2.2.2** | Injection Boundary | Negative transaction amount (`amount: -50000`) | HTTP 400 Bad Request | Negative transaction allowed |
| **T2.2.3** | Injection Boundary | Non-numeric string amount (`amount: "ten_k"`) | HTTP 400 Bad Request | String accepted as amount |
| **T2.2.4** | Injection Boundary | Empty transaction description (`description: ""`) | HTTP 400 Bad Request | Empty description saved |
| **T2.2.5** | Injection Boundary | Multi-billion IDR amount (5 Miliar IDR) | HTTP 201, no integer overflow | Floating point corruption |
| **T2.2.6** | Injection Boundary | SQL Injection & XSS payload in description | HTTP 201, escaped safely, DB intact | SQL syntax error or table drop |
| **T2.3.1** | Feature Boundary | Duplicate feature activation | HTTP 409 Conflict | Duplicate row inserted |
| **T2.3.2** | Feature Boundary | Activating unknown feature ID | HTTP 404 Not Found | Ghost feature created |
| **T2.3.3** | Feature Boundary | Bundle claim with 1 feature already active | HTTP 200, only activates remaining | Duplicate feature or double points |
| **T2.3.4** | Feature Boundary | Bundle claim when all features active | HTTP 200, handled idempotently | Unhandled crash or error |
| **T2.3.5** | Feature Boundary | Non-existent bundle rule ID | HTTP 404 Not Found | Server accepts phantom bundle |
| **T2.4.1** | Life Event Boundary| Persona with no matching category signals | `detected: false` or rule not matched | False positive life event trigger |
| **T2.4.2** | Life Event Boundary| Only optional signals present (0 required) | 0% confidence, rule skipped | Optional signals alone trigger bundle |
| **T2.4.3** | Life Event Boundary| Confidence strictly below 60% threshold | Bundle proposal NOT displayed | Sub-60% bundle triggered |
| **T2.4.4** | Life Event Boundary| 1 required + all optional signals (62.5%) | Meets >= 60% threshold, triggers | Fails to round or trigger at 62.5% |
| **T2.4.5** | Life Event Boundary| Full signals matching | 100% confidence achieved | Confidence calculation underflow |
| **T2.5.1** | Gamification Clamping| Total raw score > 100 PTS | Score strictly clamped to 100 | Score exceeds 100 |
| **T2.5.2** | Gamification Clamping| Clamped score 100 tier mapping | Maps to Diamond Tier | Wrong tier assigned |
| **T2.5.3** | Gamification Clamping| Minimum score baseline floor | Score >= 20 PTS | Score drops below 20 |
| **T2.5.4** | Gamification Clamping| Tier Cutoff Boundary: 40 vs 41 | Score 40 = Bronze, Score 41 = Silver | Off-by-one tier boundary |
| **T2.5.5** | Gamification Clamping| Tier Cutoff Boundary: 70 vs 71 | Score 70 = Silver, Score 71 = Gold | Off-by-one tier boundary |
| **T2.5.6** | Gamification Clamping| Tier Cutoff Boundary: 90 vs 91 | Score 90 = Gold, Score 91 = Diamond | Off-by-one tier boundary |

---

### Tier 3: Cross-Feature Combinations (Pairwise Integration Flows)

| Test ID | Interaction Pair | Flow Steps & Verification | Expected Pairwise Behavior |
|---|---|---|---|
| **T3.1** | Persona Switching ↔ State Isolation | Login Dimas -> Check balance 14.5M & Silver tier -> Login Ayu -> Check balance 38.2M & Gold tier -> Verify zero data bleed | Mutually exclusive multi-tenant state; actions on one persona do not contaminate another. |
| **T3.2** | Injection ↔ Balance ↔ AI Cascade | Login Dimas -> Inject 8.5M Salary -> Verify balance 23.0M -> Query AI evaluation -> Verify propensity score increase and audit log generation | Atomic single-transaction pipeline: Balance, AI vectors, and Mutasi update simultaneously. |
| **T3.3** | Bundle Claim ↔ Batch Activation ↔ Tier Upgrade | Dimas (Silver, 45 PTS) -> Claim Mulai Kerja Kit (auto_save + health_insurance) -> Verify active features -> Verify Gamification Score jumps to 85 PTS -> Tier upgrades to Gold | Multi-entity batch insertion directly triggers gamification tier progression. |
| **T3.4** | Mutation ↔ 1-Click DB Reset | Login Dimas -> Mutate balance via injection -> Activate features -> Call `POST /api/admin/reset` -> Re-query account and features | 100% atomic reversion to pristine baseline seed datasets. |
| **T3.5** | Simulation Presets ↔ Mode Juri Trace | Login Sari -> Trigger `scen_merchant` -> Verify net balance update -> Inspect `GET /api/ai/audit-logs` for simulation entry | Live decision trace log stream immediately accessible to jury inspector panel. |

---

### Tier 4: Real-World Application Scenarios (5 Persona Journeys)

1. **Journey 1: Dimas Prasetyo (Fresh Graduate)**
   - *Flow*: Authentic login (`dimas2026` / `Password123!`) $\rightarrow$ Verify initial balance (Rp 14.500.000) and Silver tier (45 PTS) $\rightarrow$ Inject second month salary (+Rp 8.500.000 CR) and kos rent (-Rp 2.200.000 DB) $\rightarrow$ Verify balance updates to Rp 20.800.000 $\rightarrow$ Detect `FRESH_GRADUATE` life event (100% confidence) $\rightarrow$ 1-Click claim Mulai Kerja Kit $\rightarrow$ Gamification score increases to 85 PTS and tier upgrades to Gold.
2. **Journey 2: Ayu Ratnasari (Newlywed / Rumah Tangga Baru)**
   - *Flow*: Quick-login as Ayu $\rightarrow$ Verify Tahapan BCA balance (Rp 38.200.000) and Gold tier (80 PTS) $\rightarrow$ Inject monthly partner transfer (-Rp 5.000.000 DB) and KPR mortgage (-Rp 3.800.000 DB) $\rightarrow$ Detect `NEWLYWED` life event (100% confidence) $\rightarrow$ 1-Click claim Rumah Tangga Baru Kit $\rightarrow$ Activate Joint Account, Family Budgeting, Family Insurance $\rightarrow$ Gamification score hits 100 PTS (Diamond Tier).
3. **Journey 3: Hj. Sari Wijaya (Pro Merchant / Pemilik Usaha)**
   - *Flow*: Quick-login as Sari $\rightarrow$ Verify BCA Bisnis account (Rp 125.400.000) $\rightarrow$ Inject daily QRIS merchant settlement (+Rp 4.500.000 CR) and supplier disbursement (-Rp 3.200.000 DB) $\rightarrow$ Verify net balance updates to Rp 126.700.000 $\rightarrow$ Detect `BUSINESS_OWNER` life event $\rightarrow$ Claim Pro Merchant Kit $\rightarrow$ Verify QRIS Merchant & Cashflow Report confirmed active.
4. **Journey 4: Rina Kartika (Mahasiswa Aktif)**
   - *Flow*: Quick-login as Rina $\rightarrow$ Verify Tahapan Xpresi account (Rp 3.400.000) and Silver tier (50 PTS) $\rightarrow$ Inject parental allowance (+Rp 2.500.000 CR) and UKT tuition fee (-Rp 1.500.000 DB) $\rightarrow$ Detect `STUDENT` life event $\rightarrow$ Claim Mahasiswa Starter Pack $\rightarrow$ Verify Student Savings active and score updated.
5. **Journey 5: Drs. Bambang Hariyanto (Menjelang Pensiun)**
   - *Flow*: Quick-login as Bambang $\rightarrow$ Verify high balance (Rp 245.000.000) and Diamond tier (100 PTS) $\rightarrow$ Inject Reksa Dana investment (-Rp 8.000.000 DB) and Deposito (-Rp 10.000.000 DB) $\rightarrow$ Detect `PRE_RETIREMENT` life event $\rightarrow$ Claim Golden Age Retirement Kit $\rightarrow$ Verify conservative investment & Welma portfolio active $\rightarrow$ Confirm Diamond tier ceiling maintained.

---

## 4. How to Run the Tests

### Command Lines:
```powershell
# Run the complete test suite (all 4 tiers) against default localhost:3000
node tests/e2e_runner.js

# Run against a custom URL or port
node tests/e2e_runner.js --url http://localhost:8080

# Run specific tiers
node tests/e2e_runner.js --tier 1
node tests/e2e_runner.js --tier 2
node tests/e2e_runner.js --tier 3
node tests/e2e_runner.js --tier 4

# Run with immediate failure halting and verbose error traces
node tests/e2e_runner.js --bail --verbose
```

### Exit Codes:
- `0`: All executed test assertions passed successfully (100%).
- `1`: One or more test assertions failed, or server initialization failed.
