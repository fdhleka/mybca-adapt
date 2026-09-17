# AI Engine Algorithms & Interactive Simulation Lab — Specification Mining Report

**Project**: myBCA ADAPT Interactive Simulation  
**Author**: Spec Miner 3 (`survey_ai_spec_miner_3`)  
**Date**: 2026-09-11  
**Source References**:
- `prototype/algorithms.js` (Core Engine Implementation)
- `prototype/seed-data.js` (Features Catalog, Personas, Mutation Histories, Scenarios)
- `prototype/app.js` (UI Controller, Pipeline Cascade, Event Handling)
- `prototype/index.html` & `full-website-code.html` (Dashboard Layout, Audit Drawer, Formulas Markup)
- `Business_Case_myBCA_Ringkasan_Diskusi.pdf` (Closed-Loop Architecture, Promotion Strategy, Value Proposition)
- `PROPOSAL YNFEST KITKAT.pdf` (Fishbone Cause Analysis, Family Life Cycle, Opportunity Mapping)
- `.agents/ORIGINAL_REQUEST.md` (System Requirements R1–R5, Acceptance Criteria)

---

## 1. Executive Summary

The **myBCA ADAPT** system transforms myBCA from a passive transactional utility into an intelligent, adaptive financial platform. It deploys three synchronized AI engines running a closed-loop data pipeline:
1. **Algoritma 1 (Transaction Personalization)**: Computes propensity match vectors ($0–99\%$) based on normalized transaction frequency ($60\%$) and nominal spending volume ($40\%$) to rank contextual features with 1-click activation.
2. **Algoritma 2 (Life Event Detection & Smart Bundling)**: Analyzes multi-period category shifts between baseline ($T-1$) and current period ($T$) transactions to detect major life transitions (Fresh Graduate, Newlywed, Business Expansion, Student, Pre-Retirement) with a confidence threshold $\ge 60\%$, deploying high-value bundled product offerings.
3. **Algoritma 3 (Financial Health Gamification Score)**: Evaluates a dynamic $0–100$ financial health score using a multi-factor weighted equation (Base 20 PTS + Feature Points + Timeliness 15 PTS + Savings 15 PTS), mapping users to badge tiers (Bronze, Silver, Gold, Diamond) and incentivizing adoption.
4. **Interactive Simulation Lab & Audit Engine Inspector**: Provides an interactive testbed allowing jury/evaluators to inject arbitrary transactions or preset scenarios, witnessing instantaneous real-time recalculation across all three engines, accompanied by an openable mathematical formula inspector and live decision trace logging.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Algoritma 1 | Rule-Based Propensity Scoring | Computes affinity match score per feature based on transaction frequency and amount | `transactions[]`, `activeFeatures[]` | Array of `{feature, score, reason, signals}` sorted descending | Returns baseline random score (15–34%) if no matched signals; empty array if all active | `prototype/algorithms.js:26-103` |
| 2 | Algoritma 1 | 1-Click Feature Activation | Enables immediate adoption of recommended feature directly from card | `featureId` | Updates `activeFeatures`, increments Gamification Score, logs trace | Prevents duplicate activation; ignores unknown feature ID | `prototype/app.js:213-237` |
| 3 | Algoritma 1 | Contextual Rationale Generation | Generates human-readable explanation of why a feature was recommended | Matched transaction category counts & amounts | Formatted string (e.g. `Terdeteksi pola transaksi: Gaji Bulanan (1x, Rp 8.500.000)`) | Falls back to default `"Berdasarkan rekomendasi sistem AI myBCA"` | `prototype/algorithms.js:85-88` |
| 4 | Algoritma 2 | Multi-Period Pattern Shift Analysis | Compares unique category sets between baseline period ($T-1$) and current period ($T$) | `baselineHistory[]`, `currentHistory[]` | Categories present in current but absent/recurrent in baseline | Gracefully handles empty history by returning `null` | `prototype/algorithms.js:108-113` |
| 5 | Algoritma 2 | Life Event Signal Matching | Evaluates 5 pre-configured life stage rules against current category signals | Category sets, Rule Signal Definitions | Matched count for required signals and optional signals | If required signals count == 0, confidence is 0 and rule is skipped | `prototype/algorithms.js:171-195` |
| 6 | Algoritma 2 | Confidence Score Calculation | Computes weighted confidence ($0–100\%$) where required signals have 75% max weight and optional signals have 25% | `reqCount`, `reqTotal`, `optCount`, `optTotal` | Integer confidence percentage ($0–100\%$) | Rule disqualified if confidence < 60% threshold | `prototype/algorithms.js:183-186` |
| 7 | Algoritma 2 | Smart Bundle Modal/Banner | Renders high-visibility banner proposing curated multi-feature bundle with bonus points | `detectedEvent` payload | Banner UI with bundle title, description, detected signals, feature chips, and claim button | Renders monitoring placeholder banner if confidence < 60% | `prototype/app.js:128-182` |
| 8 | Algoritma 2 | 1-Click Bundle Claim | Batch-activates all features in bundle and awards bonus gamification points | `rule.featuresToBundle[]` | Batch appends to `activeFeatures`, triggers toast and live recalculation | Filters out already active features to prevent duplicate point inflation | `prototype/app.js:172-181` |
| 9 | Algoritma 3 | Weighted Financial Health Score | Calculates composite health index on 0–100 scale from platform base, active features, timeliness, and savings | `persona` object (`activeFeatures`, `timelinessRate`, `savingsConsistency`) | `{score, tier, badgeClass, rewardPoints, breakdown, nextTierThreshold}` | Score strictly clamped between 0 and 100 via `Math.min(100, rawScore)` | `prototype/algorithms.js:209-274` |
| 10 | Algoritma 3 | Tier Badge & Reward Mapping | Maps score to Bronze (0-40), Silver (41-70), Gold (71-90), Diamond (91-100) and BCA reward points | `finalScore` | Tier badge name, CSS class, and reward points (250, 1000, 2500, 5000) | Default tier is Bronze if score <= 40 | `prototype/algorithms.js:231-256` |
| 11 | Algoritma 3 | Score Component Breakdown Inspection | Exposes granular itemization of points contributed by each sub-component | `breakdown` dictionary | UI list showing +Base, +Active Feature PTS, +Timeliness PTS, +Savings PTS | Hides optional bonuses if bonus value is 0 | `prototype/app.js:89-124` |
| 12 | Simulation Lab | Preset Scenario Injection | 1-Click execution of realistic life-stage simulation scenarios for jury presentation | `scenarioId` (`scen_freshgrad`, `scen_newlywed`, `scen_merchant`) | Prepends transactions, switches persona, triggers recalculation cascade | Ignores invalid scenario ID; retains existing history | `prototype/app.js:264-297` |
| 13 | Simulation Lab | Custom Manual Transaction Injector | Interactive form to inject custom financial transactions directly into active account | Description, Category, Amount (Rp) | Prepends transaction to `historyCurrent`, triggers toast and engine cascade | Rejects empty descriptions or non-positive amounts (`amount <= 0`) | `prototype/app.js:318-339` |
| 14 | Simulation Lab | Instant Recalculation Pipeline | Orchestrated cascade refreshing balance, Algoritma 1, 2, 3, mutation table, and logs | Trigger event (inject tx, activate feature, claim bundle, switch persona) | UI DOM completely updated in single tick (< 16ms) | None; synchronous re-render via `renderAll()` | `prototype/app.js:50-58` |
| 15 | Audit Inspector | Mathematical Formula Display | Collapsible jury panel displaying exact mathematical equations and parameter weights | DOM toggle event | Math cards for Propensity Vector, Pattern Shift Confidence, and Health Score | Persists collapsed/expanded state via CSS class | `prototype/index.html:220-251` |
| 16 | Audit Inspector | Real-time Decision Log Stream | Visual scrolling terminal showing timestamped audit decisions from all engines | `engine.log(subsystem, message, data)` | Formatted console entries with timestamp `[HH:MM:SS]`, subsystem badge, and text | Buffer capped at 50 entries to prevent memory leak | `prototype/algorithms.js:15-21` |

---

## 3. Edge Cases & Boundary Behaviors

| # | Feature | Input / Condition | Observed Behavior | Analysis & Recommendation |
|---|---------|-------------------|-------------------|---------------------------|
| 1 | Algoritma 1 | Empty transaction history (`transactions = []`) | `totalCount = 0`, `maxAmount = 1`. `count > 0` loop skipped. `scoreVal = 0`. Final score triggers `< 15` fallback: `15 + Math.floor(Math.random() * 20)`. | Generates random baseline (15–34%) with default rationale. Safe against divide-by-zero due to `Math.max(1, totalCount)`. |
| 2 | Algoritma 1 | All catalog features already active | `activeFeatures` contains all 12 feature IDs. | Loop skips all features (`if (activeFeatures.includes(featId)) return;`). Returns `[]`. UI renders empty state card: "Semua Rekomendasi Utama Telah Aktif!". |
| 3 | Algoritma 1 | Feature present in catalog but omitted from `featureMap` (e.g. `child_savings`) | `featId = "child_savings"`, `featureMap["child_savings"]` is undefined. | `targetCats` resolves to `[]`. `scoreVal` remains 0. Feature receives floor random score (15–34%). Recommendation: Add explicit category mapping `["Biaya Sekolah", "Tabungan Anak"]` for `child_savings`. |
| 4 | Algoritma 1 | Non-deterministic score jitter | Identical transaction history evaluated multiple times. | `Math.random() * 5` and random floor introduce slight variations ($\pm 5\%$). In testing/benchmarking, replace with deterministic pseudorandom seed or eliminate random term for reproducible assertions. |
| 5 | Algoritma 1 | Maximum score cap | Extremely high transaction frequency and volume. | Score scaled by $1.8 \times$, but strictly capped at 99% via `Math.min(99, ...)`. Score will never display 100% in recommendation feed. |
| 6 | Algoritma 2 | Only optional signals present (0 required signals) | User has `Jajan & Hangout` (optional for Student) but neither `Bayar Kampus / UKT` nor `Transfer Masuk Ortu`. | `reqCount = 0`. Engine condition `if (reqCount > 0)` prevents calculation. Confidence remains 0. Life event will NOT trigger, preventing false positives from noise. |
| 7 | Algoritma 2 | Exactly 1 of 2 required signals + all optional signals | E.g. Fresh Grad with `Gaji Bulanan` (1/2 required) + `Cicilan` + `Tagihan` (2/2 optional). | $\text{Confidence} = (1/2 \times 75) + (2/2 \times 25) = 37.5 + 25 = 62.5 \approx 63\%$. Since $63\% \ge 60\%$, the bundle TRIGGERS! |
| 8 | Algoritma 2 | Exactly 1 of 2 required signals + 0 optional signals | E.g. Fresh Grad with only `Gaji Bulanan` present. | $\text{Confidence} = (1/2 \times 75) + 0 = 37.5 \approx 38\%$. Since $38\% < 60\%$, bundle does NOT trigger. Requires either both required signals or 1 required + supporting optional signals. |
| 9 | Algoritma 2 | Tie between two life events with identical confidence | Two rules evaluate to equal confidence (e.g. both 75%). | Condition `if (confidence > highestConfidence)` is strictly greater than. The first rule encountered in rule array order wins. |
| 10 | Algoritma 2 | Claiming bundle when some features already active | User previously activated `auto_save`, then triggers Fresh Grad Kit (`auto_save`, `health_insurance`). | Loop checks `if (!currentPersona.activeFeatures.includes(fid))` before adding. Only unactivated features are appended; existing features are not duplicated. |
| 11 | Algoritma 3 | Score overflow beyond 100 PTS | User activates all 12 features (total 200 PTS) + Base 20 + Timeliness 15 + Savings 15 = 250 PTS raw. | Score is hard clamped to 100 via `Math.min(100, rawScore)`. User achieves Diamond Tier (91-100). |
| 12 | Algoritma 3 | Minimum possible score (Floor) | Fresh account with 0 active features, timeliness < 95%, savingsConsistency = false. | Raw score = $20 + 0 + 0 + 0 = 20$ PTS. Floor is 20 PTS. Tier: Bronze. |
| 13 | Algoritma 3 | Discrepancy between Prototype & DISPATCH Tier Ranges | Prototype code has Bronze: 0-40, Silver: 41-70, Gold: 71-90, Diamond: 91-100. DISPATCH notes Bronze: 0-49, Silver: 50-69, Gold: 70-84, Diamond: 85-100. | Under prototype rules, Dimas (score 45) is Silver. Under DISPATCH rules, Dimas (score 45) would be Bronze! Implementation must standardize (see Section 6). |
| 14 | Simulation Lab | Balance mutation upon manual transaction injection | User submits manual transaction via `addTxForm`. | In `prototype/app.js`, `historyCurrent.unshift()` was executed, but `currentPersona.balance` was NOT mutated in the prototype DOM controller. Acceptance criteria R5 mandates that balance MUST update. Fullstack implementation must compute `balance += (isCredit ? amount : -amount)`. |
| 15 | Simulation Lab | Negative or zero amount injection | User types `0` or negative number in manual form. | Form input has `min="1000"`, JS checks `if (desc && amount > 0)`. Zero or negative submission is silently rejected. |

---

## 4. Algoritma 1: Transaction Personalization (Propensity Scoring Engine)

### 4.1 Objective & Context
Conventional banking applications deliver generic promotional blasts (e.g., broad banners or push notifications) that are ignored by up to $92\%$ of users (*Business Case*, p. 2). Algoritma 1 replaces push spam with **contextual pull recommendations**: analyzing real-time debit and credit card/QRIS/transfer mutations to recommend high-utility features exactly tailored to the user's spending habits.

### 4.2 Input & Output Data Contracts
```typescript
interface Transaction {
  date: string;          // ISO-8601 YYYY-MM-DD
  category: string;      // Category label matching featureMap signals
  amount: number;        // Nominal value in IDR
  desc: string;          // Mutation description
  icon?: string;         // Bootstrap Icon class
}

interface PropensityScoreResult {
  feature: FeatureItem;  // Feature metadata (id, name, points, desc, icon)
  score: number;        // Normalized affinity percentage (0 - 99%)
  reason: string;       // Contextual explanation for user & audit
  signals: string[];    // Array of matched transaction evidence strings
}
```

### 4.3 Exact Mathematical Formula & Weight Parameters
For each candidate feature $f \in \text{Catalog} \setminus \text{ActiveFeatures}$:
1. Extract candidate target categories: $\mathcal{C}_f = \text{featureMap}[f]$.
2. Calculate category transaction count $N_c$ and cumulative amount $A_c$ for each category $c \in \mathcal{C}_f$:
   $$N_c = \sum_{t \in \mathcal{T}, \text{cat}(t) = c} 1, \quad A_c = \sum_{t \in \mathcal{T}, \text{cat}(t) = c} \text{amount}(t)$$
3. Compute normalized frequency and normalized monetary amount:
   $$\text{FreqNorm}_c = \frac{N_c}{\max(1, N_{\text{total}})}$$
   $$\text{AmtNorm}_c = \frac{A_c}{\max(1, A_{\max})}$$
   where $N_{\text{total}}$ is total transactions in period, and $A_{\max} = \max_{c'} A_{c'}$.
4. Compute composite category affinity score with $60/40$ weight distribution:
   $$\text{CatScore}_c = (0.60 \times \text{FreqNorm}_c \times 100) + (0.40 \times \text{AmtNorm}_c \times 100) = 60 \cdot \text{FreqNorm}_c + 40 \cdot \text{AmtNorm}_c$$
5. Accumulate raw score across all target categories of feature $f$:
   $$\text{ScoreVal}(f) = \sum_{c \in \mathcal{C}_f, N_c > 0} \text{CatScore}_c$$
6. Scale and apply baseline floor:
   $$\text{FinalScore}(f) = \min\left(99, \text{round}\left(\text{ScoreVal}(f) \times 1.8 + \epsilon\right)\right) \quad (\epsilon \sim \mathcal{U}(0, 5))$$
   $$\text{If } \text{FinalScore}(f) < 15 \implies \text{FinalScore}(f) = 15 + \lfloor \mathcal{U}(0, 20) \rfloor$$

### 4.4 Feature Affinity Map (`featureMap`)
| Feature ID | Feature Name | Points | Target Categories in `featureMap` | Rationale / Logic |
|------------|--------------|:------:|-----------------------------------|-------------------|
| `auto_save` | Tabungan Otomatis Gaji (Auto-Save) | +20 | `["Gaji Bulanan", "Transfer Masuk"]` | Recurring salary inflows indicate prime opportunity for automated savings deduction. |
| `health_insurance` | Asuransi Kesehatan Mandiri | +20 | `["Gaji Bulanan", "Sewa Kos / Housing"]` | Independent living expenses (rent + salary) indicate need for self-funded health protection. |
| `paylater_reminder` | Reminder Paylater Otomatis | +10 | `["Paylater", "Cicilan / Paylater"]` | Active credit usage requires automated reminders to eliminate late fee risks. |
| `joint_account` | Joint Account (Rekening Bersama) | +15 | `["Transfer Pasangan", "Supermarket / Dapur"]` | Household groceries and partner transfers indicate shared financial management. |
| `family_budgeting` | Family Budgeting & Expense Tracker | +10 | `["Supermarket / Dapur", "Cicilan KPR / Rumah"]` | High domestic expenses require envelope budgeting and limit enforcement. |
| `family_insurance` | Asuransi Jiwa & Keluarga | +20 | `["Cicilan KPR / Rumah", "Transfer Pasangan"]` | Long-term family debt obligations (KPR) require life and term protection. |
| `qris_merchant` | BCA Merchant & QRIS Bisnis | +15 | `["Terima QRIS Merchant", "Transfer Supplier"]` | Inbound merchant settlements and vendor payments warrant dedicated QRIS merchant tools. |
| `cashflow_report` | Laporan Arus Kas Bisnis | +10 | `["Transfer Supplier", "Gaji Karyawan"]` | Multi-party business disbursements require automated cash flow tracking. |
| `student_savings` | Tabungan Pelajar & Saku Budget | +15 | `["Bayar Kampus / UKT", "Transfer Masuk Ortu"]` | Tuition and parental allowances require zero-admin student pocket accounts. |
| `conservative_invest`| Investasi Konservatif (Reksa Dana) | +20 | `["Investasi Reksa Dana", "Investasi Deposito"]` | Habitual wealth accumulation indicates readiness for money market funds. |
| `welma_portfolio` | Welma Investment Portfolio Tracker | +15 | `["Gaji Bulanan", "Investasi Reksa Dana"]` | Surplus discretionary income warrants multi-asset portfolio visibility. |
| `child_savings`* | Tabungan Pendidikan Anak | +20 | *(Unmapped in prototype)* | Recommended mapping: `["Perlengkapan Bayi", "Sekolah Anak"]`. |

### 4.5 Ranking & 1-Click Activation Mechanics
- Recommendations are sorted descending by `score` ($\text{FinalScore}$).
- The top 3 items (`recs.slice(0, 3)`) are rendered in the dashboard feed.
- Each item features an `Aktifkan 1-Tap (+X PTS)` button.
- Action:
  1. Appends `featId` to `persona.activeFeatures`.
  2. Dispatches toast notification with feature name and earned points.
  3. Writes audit log entry: `[USER_ACTION] Fitur diaktifkan: <Feature Name>`.
  4. Triggers instantaneous recalculation (`renderAll()`): the activated feature disappears from recommendations, next highest candidate moves into top 3, and Gamification Score increases immediately.

---

## 5. Algoritma 2: Life Event Detection & Smart Bundling

### 5.1 Objective & Context
Financial products have dramatically higher conversion rates when introduced during major life transitions (Family Life Cycle Theory; *Proposal*, p. 12). Rather than promoting individual features in isolation, Algoritma 2 detects macro pattern shifts between historical baseline behavior ($T-1$) and current active mutations ($T$). When high confidence is reached ($\ge 60\%$), it presents a curated **Smart Bundle** offering simultaneous activation of multiple complimentary features.

### 5.2 Multi-Period Pattern Shift Comparison
- $\mathcal{S}_{\text{base}} = \{ \text{cat}(t) \mid t \in \mathcal{H}_{\text{baseline}} \}$ (Set of unique categories in baseline period).
- $\mathcal{S}_{\text{curr}} = \{ \text{cat}(t) \mid t \in \mathcal{H}_{\text{current}} \}$ (Set of unique categories in current active period).
- Sinyal baru yang muncul pada $\mathcal{S}_{\text{curr}}$ dievaluasi terhadap himpunan aturan fase hidup.

### 5.3 Life Event Specifications & Rule Table
| Rule ID | Event Name | Target Bundle | Required Signals (75% Weight) | Optional Signals (25% Weight) | Features to Bundle | Bonus PTS | Target Persona |
|---------|------------|---------------|--------------------------------|-------------------------------|--------------------|:---------:|----------------|
| `FRESH_GRADUATE` | Mulai Kerja / Fresh Graduate | Mulai Kerja Kit | `["Gaji Bulanan", "Sewa Kos / Housing"]` | `["Cicilan / Paylater", "Tagihan Utilitas"]` | `["auto_save", "health_insurance"]` | +25 PTS | Dimas (23 yo) |
| `NEWLYWED` | Rumah Tangga Baru | Rumah Tangga Baru Kit | `["Transfer Pasangan", "Cicilan KPR / Rumah"]` | `["Supermarket / Dapur"]` | `["joint_account", "family_budgeting", "family_insurance"]` | +30 PTS | Ayu (28 yo) |
| `BUSINESS_OWNER` | Pemilik Usaha (Merchant) | Pro Merchant Kit | `["Terima QRIS Merchant", "Transfer Supplier"]` | `["Gaji Karyawan"]` | `["qris_merchant", "cashflow_report"]` | +25 PTS | Sari (35 yo) |
| `STUDENT` | Mahasiswa / Pelajar | Mahasiswa Starter Pack | `["Bayar Kampus / UKT", "Transfer Masuk Ortu"]` | `["Jajan & Hangout"]` | `["student_savings"]` | +15 PTS | Rina (20 yo) |
| `PRE_RETIREMENT` | Persiapan Pensiun | Golden Age Retirement Kit | `["Investasi Reksa Dana", "Pengeluaran Rumah"]` | `["Investasi Deposito"]` | `["conservative_invest", "welma_portfolio"]` | +35 PTS | Bambang (56 yo) |

### 5.4 Confidence Score Formula & Decision Logic
For each life event rule $R$:
1. Let $K_{\text{req}}$ be the count of $s \in R.\text{requiredSignals}$ where $s \in \mathcal{S}_{\text{curr}}$.
2. Let $K_{\text{opt}}$ be the count of $s \in R.\text{optionalSignals}$ where $s \in \mathcal{S}_{\text{curr}}$.
3. **Hard Gating Rule**: If $K_{\text{req}} = 0$, confidence is $0\%$ (rule disqualified).
4. **Weighted Confidence Formula**:
   $$\text{Confidence}(R) = \text{round}\left( \left(\frac{K_{\text{req}}}{|R.\text{requiredSignals}|} \times 75\right) + \left(\frac{K_{\text{opt}}}{\max(1, |R.\text{optionalSignals}|)} \times 25\right) \right)$$
5. **Trigger Threshold**:
   $$\text{Rule is eligible iff } \text{Confidence}(R) \ge 60\%$$
6. **Best Match Selection**:
   $$\text{BestMatch} = \arg\max_{R} \left\{ \text{Confidence}(R) \mid \text{Confidence}(R) \ge 60\% \right\}$$

### 5.5 1-Click Bundle Activation Payload & Flow
When an eligible life event is detected, the UI renders a prominent dark-glassmorphic banner:
- Header: `Momen Hidup Terdeteksi (<Confidence>% Confidence)`
- Title: Bundle Name (e.g. `Mulai Kerja Kit`)
- Description: Humanized rationale from rule
- Evidence badges: List of detected transaction signals
- Feature chips grid: Interactive listing of included features
- CTA Button: `Aktifkan Paket Bundle Sekaligus (+<Bonus> PTS Bonus)`

Clicking the CTA:
1. Iterates over `rule.featuresToBundle`.
2. Appends any non-active feature IDs to `persona.activeFeatures`.
3. Displays celebratory toast.
4. Generates audit trace: `[USER_ACTION] User mengaktifkan bundle: <Bundle Name>`.
5. Recalculates all engines: Gamification Score increases immediately by the sum of feature points; recommendations feed removes bundled items; banner reflects active status.

---

## 6. Algoritma 3: Financial Health Gamification Score

### 6.1 Objective & Context
Gamification converts passive financial literacy into an active, rewarding progression system (*Business Case*, p. 3; *Proposal*, p. 18). It answers the critical user friction: *"Why should I spend time setting up these features?"* Users receive immediate visual feedback, level status badges, and redeemable BCA reward points.

### 6.2 Mathematical Equation & Component Weights
The health score is computed on a strict scale of $0$ to $100$:

$$\text{RawScore} = \text{BaseScore} + \sum_{f \in \mathcal{F}_{\text{active}}} P_f + \text{Bonus}_{\text{timeliness}} + \text{Bonus}_{\text{savings}}$$
$$\text{FinalScore} = \min(100, \text{RawScore})$$

#### Sub-Component Specifications:
1. **Base Platform Score ($\text{BaseScore}$)**:
   - Value: $+20$ PTS.
   - Purpose: Baseline encouragement for all active myBCA users.
2. **Feature Points ($\sum P_f$)**:
   - Points assigned to currently active features:
     - Tier 1 High-Impact Features (+20 PTS): `auto_save`, `health_insurance`, `family_insurance`, `child_savings`, `conservative_invest`.
     - Tier 2 Medium-Impact Features (+15 PTS): `joint_account`, `qris_merchant`, `student_savings`, `welma_portfolio`.
     - Tier 3 Utility Features (+10 PTS): `paylater_reminder`, `family_budgeting`, `cashflow_report`.
3. **Timeliness Bonus ($\text{Bonus}_{\text{timeliness}}$)**:
   - Condition: `persona.timelinessRate >= 95`
   - Value: $+15$ PTS (0 PTS if timeliness < 95%).
4. **Savings Consistency Bonus ($\text{Bonus}_{\text{savings}}$)**:
   - Condition: `persona.savingsConsistency === true`
   - Value: $+15$ PTS (0 PTS if false).

### 6.3 Tier Badge Mapping & Reward Points
The score maps into four recognizable achievement tiers:

| Tier Name | Score Range (Prototype) | Score Range (Dispatch) | Badge Class | Gradient Visual | Reward Points | Next Threshold |
|-----------|:-----------------------:|:----------------------:|:-----------:|:---------------:|:-------------:|:--------------:|
| **Bronze** | $0 - 40$ | $0 - 49$ | `badge-bronze` | `#cd7f32` to `#a05a2c` | 250 Poin | 40 (Silver at 41) |
| **Silver** | $41 - 70$ | $50 - 69$ | `badge-silver` | `#94a3b8` to `#64748b` | 1,000 Poin | 70 (Gold at 71) |
| **Gold** | $71 - 90$ | $70 - 84$ | `badge-gold` | `#f59e0b` to `#d97706` | 2,500 Poin | 90 (Diamond at 91) |
| **Diamond**| $91 - 100$ | $85 - 100$ | `badge-diamond` | `#06b6d4` to `#3b82f6` | 5,000 Poin | 100 |

*Note for Architecture Team*: The prototype's cutoffs (`0-40`, `41-70`, `71-90`, `91-100`) were specifically calibrated so that default personas naturally span across all tiers:
- Dimas (Base 20 + Paylater 10 + Timeliness 15 = 45 PTS) falls cleanly in **Silver**.
- Ayu (Base 20 + Auto-Save 20 + Family Budgeting 10 + Timeliness 15 + Savings 15 = 80 PTS) falls in **Gold**.
- Sari (Base 20 + QRIS 15 + Cashflow 10 + Timeliness 15 + Savings 15 = 75 PTS) falls in **Gold**.
- Rina (Base 20 + Student 15 + Timeliness 15 = 50 PTS) falls in **Silver**.
- Bambang (Base 20 + Auto-Save 20 + Invest 20 + Welma 15 + Timeliness 15 + Savings 15 = 105 $\rightarrow$ 100 PTS) reaches **Diamond**.
If the backend adopts the DISPATCH thresholds (`Bronze: 0-49`), Dimas (45 PTS) would be demoted to Bronze! We recommend adopting the prototype's threshold mapping for smooth demo presentation.

### 6.4 Dynamic Live Recalculation
When any feature is activated (either 1-click single feature or bundle claim):
- `persona.activeFeatures` is mutated.
- `calcGamificationScore(persona)` is re-executed immediately.
- Score number and SVG/CSS progress circle/bar animate to new value.
- Tier badge and reward points re-evaluate.
- Detailed breakdown items update reactively.

---

## 7. Interactive Simulation Lab & Data Injector

### 7.1 Architecture & Purpose
The Simulation Lab fulfills requirement R5: an interactive test sandbox for judges to prove that the system is not a hardcoded static mockup, but a fully reactive rule engine that recalculates live whenever transactions occur.

### 7.2 Injection Mechanics

#### A. Preset Quick-Demo Scenarios
Provides 1-click trigger buttons for jury demonstrations:
1. **Skenario A (Fresh Graduate - Dimas)**:
   - Injects: "Gaji Bulanan" (Rp 8.500.000, CR) + "Sewa Kos / Housing" (Rp 2.200.000, DB).
   - Expected Trigger: `FRESH_GRADUATE` $\rightarrow$ "Mulai Kerja Kit" banner appears immediately.
2. **Skenario B (Rumah Tangga Baru - Ayu)**:
   - Injects: "Transfer Pasangan" (Rp 5.000.000, DB) + "Cicilan KPR / Rumah" (Rp 3.800.000, DB).
   - Expected Trigger: `NEWLYWED` $\rightarrow$ "Rumah Tangga Baru Kit" banner appears immediately.
3. **Skenario C (Pro Merchant - Sari)**:
   - Injects: "Terima QRIS Merchant" (Rp 4.500.000, CR) + "Transfer Supplier" (Rp 3.200.000, DB).
   - Expected Trigger: `BUSINESS_OWNER` $\rightarrow$ "Pro Merchant Kit" banner appears immediately.

#### B. Custom Manual Transaction Injector
Allows input of arbitrary financial transactions with the following fields:
- `txDesc` (String): Description / Merchant name.
- `txCat` (Enum Dropdown): "Gaji Bulanan", "Sewa Kos / Housing", "Cicilan KPR / Rumah", "Transfer Pasangan", "Terima QRIS Merchant", "Transfer Supplier", "Bayar Kampus / UKT", "Investasi Reksa Dana", "Paylater", "Jajan & Lifestyle".
- `txAmount` (Positive Integer): Nominal IDR (minimum 1,000).
- `date` (ISO String): Current date (`YYYY-MM-DD`).
- `type` (CR / DB): Inferred by category sign or explicit toggle.

### 7.3 Instant Recalculation Pipeline Cascade
Whenever a transaction is injected:
```
[User Injects Transaction (Preset or Manual Form)]
                    │
                    ▼
       1. Mutate Persona Data Store
          - Prepend transaction to historyCurrent
          - Update Account Balance: balance += (isCredit ? amount : -amount)
                    │
                    ▼
       2. Log Audit Trace Event
          - engine.log("MANUAL_INJECT", `Added tx ${desc}...`)
                    │
                    ▼
       3. Synchronous UI Cascade Execution: renderAll()
          ├── a. renderPersonaHeader()      -> Updates Balance display & Profile
          ├── b. renderGamificationCard()   -> Runs calcGamificationScore()
          │                                   Updates Score circle, Tier badge, Breakdown
          ├── c. renderLifeEventBanner()    -> Runs detectLifeEvent(base, curr)
          │                                   Updates Smart Bundle banner if conf >= 60%
          ├── d. renderRecommendationsFeed()-> Runs calcPropensityScores(curr, active)
          │                                   Re-ranks features, updates Match % and rationale
          ├── e. renderTransactionsTable()  -> Renders updated mutation table (+/- color coded)
          └── f. renderLogs()               -> Flushes new events to Audit Inspector terminal
```

### 7.4 Critical Data Consistency Finding & Recommendation
*Prototype Gap*: In `prototype/app.js` (line 326), `currentPersona.historyCurrent.unshift(...)` adds the transaction, but `currentPersona.balance` was left unmutated.  
*Backend/Frontend Action Required*: In the persistent fullstack implementation (SQLite / Express), the endpoint `POST /api/transactions` must execute a database transaction:
1. `INSERT INTO transactions (...)`
2. `UPDATE accounts SET balance = balance + :amount WHERE account_no = :accountNo`
3. Return updated account and trigger client-side recalculation.

---

## 8. Audit Engine Inspector (Mode Juri)

### 8.1 UI Layout & Collapsible Mechanics
- Layout: 420px fixed-width right sidebar or collapsible drawer.
- Toggle Control: `#inspectorToggle` button in top navigation bar (`Tampilkan / Sembunyikan Audit Inspector (Mode Juri)`).
- Desktop: Transitions `.main-wrapper` from `1fr` to `1fr 420px` layout grid.
- Mobile / Responsive: Renders as offcanvas overlay on viewports $\le 1024\text{px}$.

### 8.2 Mathematical Formula Cards
The inspector features three dark-themed formula cards:
1. **Formula 1 (Propensity Vector)**:
   $$\mathbf{S}(f) = w_{\text{freq}} \cdot \text{Norm}(\text{Freq}) + w_{\text{amt}} \cdot \text{Norm}(\text{Amt})$$
   *Subtitle*: "Menghitung vektor kecenderungan adopsi fitur dari frekuensi ($60\%$) & nominal ($40\%$) transaksi."
2. **Formula 2 (Life Event Pattern Shift)**:
   $$\text{Confidence}(E) = \sum \left(w_c \cdot \min\left(1, \frac{N_{\text{curr}}}{N_{\text{thresh}}}\right)\right)$$
   *Subtitle*: "Mendeteksi kemunculan sinyal transaksi baru secara konsisten antar-periode (Threshold $\ge 60\%$)."
3. **Formula 3 (Financial Health Weighted Score)**:
   $$\text{Score} = \text{Base}(20) + \sum P_{\text{features}} + \text{Bonus}_{\text{time}} + \text{Bonus}_{\text{save}}$$
   *Subtitle*: "Bobot terukur: Auto-Save (+20), Asuransi (+20), Paylater (+10), Ketepatan Bayar (+15)."

### 8.3 Live Decision Trace Log Stream
- Real-time auto-scrolling terminal box (`#logStream`).
- Format per entry:
  `[HH:MM:SS] [SUBSYSTEM] Message body (structured data)`
- Subsystem Event Taxonomy:
  - `[SYSTEM]`: Initialization, persona switching, database reset.
  - `[PROPENSITY_ENGINE]`: Transaction count evaluated, top feature recommended, match score.
  - `[LIFE_EVENT_ENGINE]`: Period comparison count, life event detected with confidence %, or below-threshold notice.
  - `[GAMIFICATION_ENGINE]`: Health score calculation, itemized breakdown points, tier determination.
  - `[USER_ACTION]`: Feature activation button clicks, bundle claim clicks.
  - `[SIMULATION]`: Skenario button trigger execution.
  - `[MANUAL_INJECT]`: Manual transaction submission details.
- Circular Buffer: Capped at 50 entries using `unshift()` and `pop()` to guarantee zero memory degradation during long demonstration sessions.

---

## 9. Verification & Testing Method

1. **Verify Algoritma 1 Propensity Match**:
   - Persona Dimas has 1 transaction of `Gaji Bulanan` (Rp 8.5M) and 1 of `Sewa Kos` (Rp 2.2M).
   - Expected recommendation: `Tabungan Otomatis Gaji (Auto-Save)` and `Asuransi Kesehatan Mandiri` must rank #1 and #2 with scores $> 70\%$.
   - Activate `Auto-Save`: it must disappear from recommendations, and next best feature must take its place.
2. **Verify Algoritma 2 Life Event Trigger**:
   - Inject Skenario A (`FRESH_GRADUATE` signals): `Mulai Kerja Kit` banner must appear immediately with confidence $> 70\%$.
   - Inject only optional signal `Jajan & Lifestyle`: Confidence must remain 0% and banner must not show.
3. **Verify Algoritma 3 Gamification Recalculation**:
   - Dimas baseline score: 45 (Base 20 + Paylater 10 + Timeliness 15).
   - Activate `auto_save` (+20 PTS): Score must immediately update to $65$ (Silver).
   - Activate `health_insurance` (+20 PTS): Score must immediately update to $85$ (Gold).
4. **Verify Simulation Injection & Balance Update**:
   - Inject "Gaji Bulanan" Rp 5.000.000.
   - Transaction table must show new row with `+ Rp 5.000.000` in green.
   - Audit Inspector must append `[MANUAL_INJECT]` and subsequent engine evaluation logs.

---
*End of AI Engine Algorithms & Interactive Simulation Lab Specification Report.*
