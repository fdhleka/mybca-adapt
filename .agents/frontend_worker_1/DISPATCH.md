## 2026-09-11T14:43:45Z

# Task Dispatch: Frontend Interactive Simulation (Milestones 2–5)

## Objective
Build the complete authentic myBCA frontend interactive simulation in `public/index.html`, `public/js/app.js`, and `public/css/custom-adapt.css`, seamlessly connected to the running Express backend APIs.

## References & Authoritative Assets
Read:
- `C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md` (Mandatory!)
- `C:\Users\irul2\Downloads\Bahan YNFest\.agents\orchestrator\PROJECT.md`
- `C:\Users\irul2\Downloads\Bahan YNFest\full-website-code.html` (Authentic DOM markup & layout)
- `C:\Users\irul2\Downloads\Bahan YNFest\combined-styles-komplit.css` (Official styles)
- `C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_ui_spec_miner_1\report.md`
- `C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_ai_spec_miner_3\report.md`
- `C:\Users\irul2\Downloads\Bahan YNFest\.agents\m1_worker_1\handoff.md`

Your working directory is `C:\Users\irul2\Downloads\Bahan YNFest\.agents\frontend_worker_1`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Implementation Scope & Write Ownership
You exclusively own and will create/modify:
- `public/index.html` (Complete authentic SPA with Login view, Reactive Dashboard view, Smart Bundling modal, Simulation Lab panel, and Mode Juri Audit Inspector drawer)
- `public/js/app.js` (Frontend controller, session state, REST API calls to `/api/...`, reactive UI rendering, event handlers)
- `public/css/custom-adapt.css` (Visual styling for Adapt cards, score circles, tier badges, inspector drawer, toast alerts)

## Feature Implementation Checklist
### Milestone 2: Authentic Login & Judge Quick Switcher
- [ ] Authentic login screen with official blue gradients, BCA logo fallback, and underline inputs (`.form-control`, `border-width: 0 0 1px 0`).
- [ ] Form submission with BCA ID & Password calling `POST /api/auth/login`.
- [ ] Judge Quick Switcher: 5 persona chips/buttons (Dimas, Ayu, Sari, Rina, Bambang) for 1-click auto-fill and instant login (`POST /api/auth/quick-login`).
- [ ] Session persistence (`mybca_token` in `localStorage`), auto-restoring session via `GET /api/auth/session` on reload.
- [ ] Logout button in header profile calling `POST /api/auth/logout` and cleanly returning to login view.

### Milestone 3: Reactive Dashboard & Dynamic Data Binding
- [ ] Customer Greeting: Dynamic name, masked BCA ID, avatar, and last login timestamp from active persona.
- [ ] Account Card: Tahapan BCA, account number, formatted balance in IDR, and eye-icon masked toggle (`••••••` vs Rp XX.XXX.XXX).
- [ ] Quick Banking Actions: 6 authentic feature cards (Transfer, Welma, Proteksi, Gaya Hidup, Paylater, Lainnya).
- [ ] Mutasi History: Real-time transaction list from `/api/transactions` with date, category badge, description, and color-coded amount (+CR green, -DB blue/dark).

### Milestone 4: 3 AI Engines Real-Time UI
- [ ] Algoritma 1 (Personalization): Contextual recommendations feed from `/api/ai/status` with match %, category reasoning, and 1-click activation (`POST /api/features/:id/activate`).
- [ ] Algoritma 2 (Life Events & Smart Bundling): Modal/banner displayed when `confidence >= 60%` (e.g. Mulai Kerja Kit, Rumah Tangga Baru Kit, Pro Merchant Kit), showing bundled features and 1-click claim (`POST /api/bundles/:id/activate`).
- [ ] Algoritma 3 (Gamification Health Score): Dynamic 0-100 score, tier badge (Bronze, Silver, Gold, Diamond), breakdown metrics, and real-time score bump upon feature/bundle activation.

### Milestone 5: Interactive Simulation Lab & Audit Engine Inspector
- [ ] Simulation Lab Panel:
  - Quick Scenario Runners (Fresh Grad Kit, Rumah Tangga Kit, Pro Merchant Kit) calling `/api/simulation/scenarios/:id/trigger`.
  - Manual Transaction Injector Form (Description, Category, Amount, Type CR/DB) calling `POST /api/transactions/inject` which updates the database, mutates account balance, and recalculates AI engines.
  - 1-Click Database Reset button calling `POST /api/admin/reset` with instant refresh to pristine seeds.
- [ ] Collapsible Audit Engine Inspector (Mode Juri):
  - Toggle button on top/side to open/close drawer.
  - Formula cards for Algoritma 1, 2, and 3 with active parameter values.
  - Live decision trace log stream from `/api/ai/audit-logs`.

## Verification Requirement
1. Start Express server: `node server/server.js`.
2. Verify HTTP 200 on `http://localhost:3000/`.
3. Verify that all assets load without 404s.
4. Run `node tests/e2e_runner.js` to verify automated test pass across all 4 tiers!
5. Document verification commands and test execution output in `handoff.md`.
