# Task Dispatch: Authentic UI & Authentication Spec Mining

## Objective
Analyze `C:\Users\irul2\Downloads\Bahan YNFest\full-website-code.html` and `C:\Users\irul2\Downloads\Bahan YNFest\combined-styles-komplit.css` along with `C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md` to extract the exact UI architecture, DOM structure, styling classes, login mechanisms, and dashboard elements required to build an authentic myBCA fullstack simulation.

## Investigation Scope
1. Examine `full-website-code.html`:
   - Identify login forms, BCA ID inputs, password inputs, submit actions, validation classes.
   - Identify dashboard DOM hierarchy: header, customer greeting/name, account card (card type, account number, balance display, eye icon/toggle balance), quick action menus (Transfer, Bayar/Beli, QRIS, etc.), mutasi / transaction list widget, and sidebar/navigation.
   - Extract how modals or banners (for smart bundling / alerts) can be styled using existing classes.
2. Examine `combined-styles-komplit.css`:
   - Map key CSS classes, typography, color palettes (BCA blue, gradients, badges), layout grids, responsive breakpoints.
3. Determine how to integrate:
   - Quick Switcher / Auto-fill Persona Helper in the login page for judges.
   - Logout button in header / profile menu that clears session and redirects to login.
   - Reactive DOM placeholders for dynamic binding.

## Required Output
Write a comprehensive report to `C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_ui_spec_miner_1\report.md` including:
- Concrete DOM structures and CSS class names for Login, Dashboard, Account card, Mutasi table/list, and Bundle modals.
- Recommendations for clean separation and integration into a Node.js/Express fullstack application.
- Handoff file `C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_ui_spec_miner_1\handoff.md`.

## 2026-09-11T14:18:54Z
You are a Spec Miner for the myBCA ADAPT Interactive Simulation project.
Read C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md first (mandatory!).
Your working directory is C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_ui_spec_miner_1.
Read your dispatch assignment at C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_ui_spec_miner_1\DISPATCH.md.

Analyze C:\Users\irul2\Downloads\Bahan YNFest\full-website-code.html and C:\Users\irul2\Downloads\Bahan YNFest\combined-styles-komplit.css.
Extract the exact UI architecture, DOM structure, styling classes, login mechanisms, and dashboard elements required to build an authentic myBCA fullstack simulation.
Investigate:
1. Authentic Login DOM elements, styling, layout, and how to attach a Quick Switcher / Persona Helper for judges.
2. Dashboard DOM elements: header, customer name, account card, balance visibility toggle, quick menus, mutasi history list, smart bundling modals/banners.
3. CSS classes and visual identity matching authentic myBCA.

Write your findings to C:\Users\irul2\Downloads\Bahan YNFest\.agents\survey_ui_spec_miner_1\report.md and create a self-contained handoff.md.
Notify the orchestrator with send_message when complete.

