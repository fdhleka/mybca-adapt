# Execution Plan: myBCA ADAPT Fullstack Interactive Simulation

## Objective
Build a complete, responsive, fullstack interactive simulation system for myBCA ADAPT with authentic login styling, persistent backend database, live dynamic dashboard, 3 real-time AI algorithms, simulation lab / data injector, and audit inspector.

## Phase 0: Survey & Specification Extraction
- Dispatch 3 Explorers / Spec Miners:
  - Explorer 1 (Spec Miner: UI/Auth & Authentic myBCA): Analyze `full-website-code.html` and `combined-styles-komplit.css` to map authentic login structure, dashboard components, DOM layout, and CSS assets.
  - Explorer 2 (Spec Miner: Backend, DB & Data Models): Analyze `prototype/seed-data.js` and `ORIGINAL_REQUEST.md` to map database schema, persona definitions, account structures, and seeding requirements.
  - Explorer 3 (Spec Miner: AI Engines & Simulation Lab): Analyze `prototype/algorithms.js`, `prototype/app.js`, and proposal PDFs to map formulas for Algoritma 1 (Transaction Personalization), Algoritma 2 (Life Event Detection & Smart Bundling), Algoritma 3 (Financial Health Gamification), and Simulation Lab / Audit Inspector requirements.
- Synthesize findings into `PROJECT.md` (Architecture, Feature Inventory, Milestones, Code Layout, Interface Contracts).

## Phase 1: Dual Track Initiation
- **E2E Testing Track**: Spawn E2E Testing Orchestrator to build the automated opaque-box test suite (Tiers 1-4) covering all features in `PROJECT.md`.
- **Implementation Track**:
  - **Milestone 1**: Lightweight Backend & Relational Persistent DB (Node.js/Express + SQLite/relational JSON store) with endpoints for personas, accounts, transactions, features, life events, recalculation, and 1-click DB Reset.
  - **Milestone 2**: Authentic myBCA Login & Multi-Account Persona Switcher (Quick-switcher helper for judges, session management, logout flow).
  - **Milestone 3**: Dynamic Reactive Dashboard (Live data binding of balances, account info, mutasi history, visual fidelity matching authentic myBCA design).
  - **Milestone 4**: 3 AI Engine Algorithms with Live Recalculation (Personalization, Life Event Bundling >= 60% confidence, Gamification Tier Score 0-100 with live updates on activation).
  - **Milestone 5**: Interactive Simulation Lab, Data Injector & Collapsible Audit Engine Inspector (Add transaction, live balance update, auto recalculation, formula breakdown & audit trace logs).
  - **Milestone 6**: End-to-End Integration, E2E Test Pass (100%), and Adversarial Coverage Hardening.

## Verification & Acceptance Criteria
- All criteria in ORIGINAL_REQUEST.md satisfied.
- Forensic audit checks pass without cheating or hardcoded mock data.
