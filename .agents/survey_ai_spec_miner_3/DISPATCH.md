# Task Dispatch: AI Engine Algorithms & Simulation Lab Spec Mining

## Objective
Analyze `C:\Users\irul2\Downloads\Bahan YNFest\prototype\algorithms.js`, `C:\Users\irul2\Downloads\Bahan YNFest\Business_Case_myBCA_Ringkasan_Diskusi.pdf`, `C:\Users\irul2\Downloads\Bahan YNFest\PROPOSAL YNFEST KITKAT.pdf`, and `C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md` to map the exact mathematical formulas, logic, trigger conditions, and audit logging for the 3 AI engines and the Interactive Simulation Lab.

## Investigation Scope
1. Algoritma 1: Transaction Personalization & Contextual Feature Recommendations:
   - Propensity matching formula based on transaction categories, frequency, total amounts.
   - Recommended features ranking, match percentages, rationale, and 1-click activation effect.
2. Algoritma 2: Life Event Detection & Smart Bundling:
   - Comparison between baseline period vs current period transactions.
   - Detectable life events (e.g. Mulai Kerja / Fresh Grad, Rumah Tangga Baru / Newlywed, Pro Merchant / Business Expansion, etc.).
   - Confidence score calculation (formula, weights, threshold >= 60%).
   - Bundles triggered, products included, modal/banner details, and activation logic.
3. Algoritma 3: Financial Health Gamification Score:
   - 0-100 score formula: weighted components (e.g. Savings Ratio, Expense Control, Investment Diversification, Digital Feature Adoption).
   - Badge tiers: Bronze (0-49), Silver (50-69), Gold (70-84), Diamond (85-100) or exact thresholds from specs.
   - Live update rules: how feature activation or new transactions impact the score in real time.
4. Interactive Simulation Lab & Data Injector:
   - Transaction injection inputs: category, amount, description, type (DB/CR), date.
   - Immediate cascade effects: updates account balance, stores in DB, triggers Algoritma 1, 2, 3 recalculations.
   - Collapsible "Audit Engine Inspector (Mode Juri)": mathematical formulas display, breakdown of variables, live trace log showing step-by-step AI decision making.

## Required Output
Write a comprehensive report to `C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_ai_spec_miner_3\report.md` including:
- Concrete algorithms specification and formulas.
- Step-by-step recalculation pipeline and trigger triggers.
- Audit inspector data contract and visualization specs.
- Handoff file `C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_ai_spec_miner_3\handoff.md`.
