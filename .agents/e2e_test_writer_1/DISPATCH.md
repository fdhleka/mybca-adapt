# Task Dispatch: E2E Test Suite Creation

## Objective
Design and implement a comprehensive, opaque-box, requirement-driven E2E test suite for the myBCA ADAPT fullstack interactive simulation project.

## Requirements
Read `C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md` and `C:\Users\irul2\Downloads\Bahan YNFest\.agents\orchestrator\PROJECT.md`.
Your working directory is `C:\Users\irul2\Downloads\Bahan YNFest\.agents\e2e_test_writer_1`.

## Methodology (4 Tiers)
1. **Tier 1 - Feature Coverage (>=5 per feature area)**:
   - Test all features in isolation: Login, Quick Switcher, Session, Logout, Accounts, Transactions, 1-click DB Reset, Algoritma 1 Propensity, Algoritma 2 Life Event, Algoritma 3 Gamification, Simulation Injection.
2. **Tier 2 - Boundary & Corner Cases (>=5 per feature area)**:
   - Zero amounts, invalid credentials, unauthorized session tokens, life event confidence boundary (<60% vs >=60%), gamification clamping (0-100), duplicate feature activations.
3. **Tier 3 - Cross-Feature Combinations (Pairwise)**:
   - Login as different personas -> verify distinct accounts, balances, and recommendations.
   - Transaction injection -> balance mutation -> AI recalculation -> gamification update.
   - 1-click bundle claim -> multiple features activated -> gamification tier upgrade.
   - Mutate state -> 1-click DB reset -> verify all mutations and features revert to pristine seeds.
4. **Tier 4 - Real-World Application Scenarios (>=5 realistic flows)**:
   - Scenario 1: Fresh Graduate journey (Dimas: salary + boarding house rent -> Mulai Kerja Kit triggered -> activate bundle -> gamification level up).
   - Scenario 2: Newlywed journey (Ayu: household expenses -> Rumah Tangga Baru Kit triggered -> activate bundle).
   - Scenario 3: Pro Merchant journey (Sari: QRIS merchant settlement -> Pro Merchant Kit triggered).
   - Scenario 4: Student journey (Rina: tuition fee -> Mahasiswa Starter Pack).
   - Scenario 5: Pre-retirement journey (Bambang: health & pension -> Golden Age Kit).

## Deliverables
1. Automated test runner: `C:\Users\irul2\Downloads\Bahan YNFest\tests\e2e_runner.js` (Node.js script that can run against `http://localhost:3000` or in test mode, testing all REST endpoints and simulating end-to-end flows, returning exit code 0 on pass).
2. `C:\Users\irul2\Downloads\Bahan YNFest\TEST_INFRA.md` documenting test architecture and feature coverage matrix.
3. `C:\Users\irul2\Downloads\Bahan YNFest\TEST_READY.md` when the test runner is complete and ready.
4. Self-contained handoff report in your working directory.

## 2026-09-11T14:35:37Z
You are the E2E Test Suite Creator for the myBCA ADAPT project.
Read ORIGINAL_REQUEST.md first (mandatory!).
Read your dispatch assignment at DISPATCH.md.
Read orchestrator/PROJECT.md.

Design and implement the automated opaque-box E2E test suite in C:\Users\irul2\Downloads\Bahan YNFest\tests\e2e_runner.js.
Cover all 4 tiers:
- Tier 1: Feature Coverage (>=5 per feature)
- Tier 2: Boundary & Corner Cases (>=5 per feature)
- Tier 3: Cross-Feature Combinations (Pairwise)
- Tier 4: Real-World Application Scenarios (5 persona journeys)

Create:
1. tests\e2e_runner.js (executable via node)
2. TEST_INFRA.md
3. TEST_READY.md
4. handoff.md in your working directory.
