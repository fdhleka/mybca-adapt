# Handoff Report: Authentic myBCA UI Architecture & Authentication Specification

**Agent**: `survey_ui_spec_miner_1`  
**Date**: 2026-09-11T21:33:00+07:00  
**Handoff Type**: Hard (Task Complete)

---

## 1. Observation
1. **`full-website-code.html`**:
   - Lines 1-67: Base HTML shell, meta tags, splash screen styles (`#splash-screen` linear gradient `#0d5cab`, `#0094d6`, `#00b6f1`), and inlined BCA Sans typography.
   - Lines 68-71: External stylesheet imports `<link rel="stylesheet" href="combined-styles-komplit.css">` and Bootstrap Icons CDN.
   - Lines 72-238: Inlined `.adapt-card`, `.tier-badge`, `.score-circle`, `.progress-bar-container`, `.inspector-drawer`, `.toast-adapt` styles.
   - Lines 247-260: Authentic Angular root layout `<app-root>`, `<header>` with `<nav class="navbar navbar-expand-md">`, white brand logo (`./assets/img/brand/logo-white.svg`), notification indicator with `.orange-dot`, and logout icon (`svg-icon-exit-door-solid`).
   - Line 260: `<app-dashboard-greeting>` containing customer name header (`MANUEL PERMANA PUTRA`), masked BCA ID (`MA*********6`), eye-slash toggle icon, last login timestamp (`11 Sep 2026 17:19:48 UTC+7`).
   - Line 260: `<app-dashboard-card-balance-v2>` containing account type (`TAHAPAN - IDR`), account number (`2421361110`), 6 masked bullet circles (`svg-icon-circle-small-solid`), and eye-slash visibility toggle button.
   - Line 379: `<app-dashboard-banking-features>` with 6 authentic quick action cards: Transfer, Investment Portfolio, Protection, Lifestyle, Paylater, More.
   - Line 379: `<app-dashboard-transaction-tab>` with `<app-dashboard-recent-transactions>` rendering transaction cards with date, description, category, and formatted IDR amount.
   - Lines 448-484: `<aside id="inspectorDrawer" class="inspector-drawer">` with formulas for Algoritma 1, 2, 3 and real-time decision log stream.
   - Lines 489-761: Integration controller script orchestrating persona switching, scenario injection, propensity calculation, and transaction addition.

2. **`combined-styles-komplit.css`**:
   - Line 1 to 185 (511,734 bytes total):
     - Section 2: Bootstrap 4.6.2 compiled core (`.form-control`, `.card`, `.btn-primary`, `.table`, `.navbar`).
     - Section 11: Official myBCA compiled stylesheet (`styles.c2d29b47cd3590ac.css`), containing 2,350 CSS classes.
     - Signature inputs: `.form-group input.form-control` with `border-width: 0 0 1px 0`, focus border `#2b9eff`, invalid border `#e25757`, and `.col-form-label` with `color: #005caa; font-weight: 600;`.
     - Header authentication modifier: `header.bg-auth { background: none; }`.
     - Hero background ornament: `.hero .icon-overlay:before` using `clove-ornament.139a2d89f497d64c.svg`.
     - Modal system: `.modal`, `.modal-dialog.modal-dialog-centered`, `.modal-content` (`border-radius: .75rem`), `.modal-backdrop` (`z-index: 1040!important`).

3. **`prototype/` & `ORIGINAL_REQUEST.md`**:
   - `seed-data.js` specifies 5 authentic personas: Dimas (Fresh Grad), Ayu (Newlywed), Sari (Merchant/Bisnis), Rina (Mahasiswa), Bambang (Pensiun).
   - Presets for 3 live scenarios: Fresh Grad Kit, Rumah Tangga Kit, Pro Merchant Kit.
   - Requirements mandate an authentic myBCA Login page with 1-click Judge Persona Helper and 1-click database reset to initial seeds.

---

## 2. Logic Chain
1. *From Observation 1 & 2*: The existing `full-website-code.html` represents an authentic logged-in state of the myBCA web dashboard. It does not include an explicit login view in the markup because Angular routes dynamically render components into `<router-outlet>`.
2. *From Observation 2*: In `combined-styles-komplit.css`, the exact classes for authentication pages are present (`header.bg-auth`, `.hero`, `.icon-overlay`, `.form-group` with underline inputs `border-width: 0 0 1px 0`, `.col-form-label` in `#005caa`, and `.btn-primary` in `#005caa`).
3. *From Observation 1 & 3*: By combining the `bg-auth` header, the signature underline input classes, and adding a prominent "Judge / Tester Quick Switcher" below the login form, the application fulfills Requirement R1 (Authentic Login & Multi-Account Authentication) without breaking visual authenticity.
4. *From Observation 1 (Line 260 & 379)*: The dashboard greeting, account card, balance toggle, quick banking features, and recent transaction list have complete, matching DOM structures and inlined SVG icons that can be dynamically bound to the Express backend without any external icon image requests.
5. *From Observation 1 (Lines 448-484)*: The Audit Engine Inspector Drawer is already styled and positioned fixed on the right (`.inspector-drawer` with transform translateX), which matches Requirement R5.

---

## 3. Caveats
1. **Asset Images**: External raster images such as `assets/img/brand/logo-white.svg` or remote Unsplash avatars require local fallback or SVG alternatives to guarantee offline presentation readiness. Inline SVGs exist for all major UI icons (exit door, eye slash, small circle bullets, transfer, welma, insurance, shopping bags, wallet clock, ellipsis).
2. **Font Loading**: BCA Sans is specified via webfonts. In offline conditions without webfont files, the fallback `font-family: "BCA Sans", Arial, sans-serif` cleanly inherits system Arial while maintaining layout geometry.

---

## 4. Conclusion
All UI components, DOM structures, CSS classes, and interaction patterns needed to construct an authentic, responsive myBCA fullstack simulation have been extracted and documented in `report.md`. The design system is 100% Bootstrap 4.6.2 compatible with official myBCA color variables and underline input forms. The application can cleanly separate into an Express backend serving SQLite/JSON persistence and a single responsive frontend with dynamic view switching between Authentic Login (with Judge Persona Helper) and Authentic Reactive Dashboard.

---

## 5. Verification Method
1. **Verify Report Existence & Completeness**:
   Inspect `C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_ui_spec_miner_1\report.md`. Confirm presence of Sections 1 through 6, tables for Discovered Features and Edge Cases, and concrete DOM code snippets.
2. **Verify CSS Class Consistency**:
   Check that classes `.form-group`, `border-width: 0 0 1px 0`, `.card`, `.btn-primary`, `.svg-icon-exit-door-solid`, and `.adapt-card` are defined in `combined-styles-komplit.css` and referenced accurately in `report.md`.
3. **Invalidation Conditions**:
   If an implementation uses non-standard generic styles instead of the underline inputs (`border-width: 0 0 1px 0`) or misses the eye-toggle masked balance bullets (`svg-icon-circle-small-solid`), visual authenticity with authentic myBCA will fail.
