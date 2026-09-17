# myBCA ADAPT — Authentic UI Architecture & Authentication Specification Mining Report

**Project**: myBCA ADAPT Interactive Fullstack Simulation  
**Author**: Spec Miner (`survey_ui_spec_miner_1`)  
**Specification Sources Analyzed**:
1. `C:\Users\irul2\Downloads\Bahan YNFest\full-website-code.html` (705 KB authentic Angular export with ADAPT extensions)
2. `C:\Users\irul2\Downloads\Bahan YNFest\combined-styles-komplit.css` (511 KB compiled styles, Bootstrap v4.6.2 + myBCA official design system)
3. `C:\Users\irul2\Downloads\Bahan YNFest\prototype\` (`index.html`, `styles.css`, `seed-data.js`, `algorithms.js`)
4. `C:\Users\irul2\Downloads\Bahan YNFest\.agents\ORIGINAL_REQUEST.md`

---

## 1. Executive Summary & Design System Identity

The authentic myBCA web interface is built upon a modified Bootstrap 4.6.2 core with BCA's proprietary design tokens, the "BCA Sans" typographic hierarchy, signature underline form inputs, and the distinctive BCA blue color gradient.

### 1.1 Core Color Palette & CSS Custom Properties
```css
:root {
  --dark-blue: #005caa;        /* Primary BCA Blue - Used for Header, Brand, Primary Buttons */
  --darker-blue: #144e83;      /* Active / Dark Hover State */
  --mid-blue: #0094d5;         /* Mid Blue for Gradients */
  --blue: #00b5f0;             /* Cyan / Accent Blue */
  --lighter-blue: #f5fcff;     /* Card Subtle Background */
  --light-blue: #e6f3ff;       /* Active Tab / Highlight Background */
  --dusty-blue: #5d86a0;       /* Secondary Text / Subtitle */
  --teal: #28BAB7;             /* Welma Investment & Protection Category Accent */
  --orange: #f37c30;           /* Paylater Category Accent & Notification Dot */
  --yellow: #ffc107;           /* Warning / Audit Inspector Accent */
  --green: #29b821;            /* Success Badge / Positive Mutation */
  --red: #e25757;              /* Danger / Negative Mutation / Error Border */
  --gray: #868e96;             /* Secondary Text / Disabled State */
  --gray-dark: #343a40;        /* Main Headings */
  --light: #f5f9fa;            /* Main Page Background */
  --white: #ffffff;            /* Card & Header Contrast Background */

  /* myBCA ADAPT AI Tier Gradients */
  --bronze-grad: linear-gradient(135deg, #cd7f32 0%, #a05a2c 100%);
  --silver-grad: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  --gold-grad: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  --diamond-grad: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
}
```

### 1.2 Layout & Global Shell Classes
- **Body & Base**:
  ```html
  <body class="pace-done ng-tns-0-0 no-breadcrumb" style="background-color: #f5f9fa; font-family: 'BCA Sans', Arial, sans-serif;">
  ```
- **Splash Screen Loader**:
  `#splash-screen` with `background: linear-gradient(#0d5cab, #0094d6, #00b6f1)` and `.logo.solid` width animating from `0%` to `100%`.
- **Background Ornament Overlay**:
  `.bg-layout` containing `.icon-overlay.container-lg` with background SVG clove ornament (`clove-ornament.139a2d89f497d64c.svg`).
- **Main Container**:
  `<main class="main my-3 mt-4 container-lg">`

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Authentication | Authentic Login Form | Underlined BCA ID & Password inputs with BCA Blue labels and full-width login button | BCA ID (text), Password (masked) | Authenticated session token, redirection to persona dashboard | Red underline (`.invalid .form-control`), error message under input | `combined-styles-komplit.css`, `full-website-code.html` |
| 2 | Authentication | Judge Persona Quick Switcher | 1-click auto-fill and login helper for 5 predefined personas | Click on persona pill/card | Pre-populates BCA ID + Password and auto-submits login | Fallback to manual entry if persona not selected | `ORIGINAL_REQUEST.md`, `prototype/index.html` |
| 3 | Navigation | Header & Brand Navigation | Authentic myBCA navbar with White Logo, Home/Transaction/My Account menus, Settings, Notifications | Click on nav links | Navigates view / triggers dropdowns | None (graceful no-op for mock subpages) | `full-website-code.html:247-260` |
| 4 | Navigation | Header Logout Action | Authentic exit-door icon button in header and sidebar | Click event | Invalidates session, resets state, redirects to Login | Returns to Login page with toast | `full-website-code.html:260` (`svg-icon-exit-door-solid`) |
| 5 | Dashboard | Customer Greeting & BCA ID | Shows Nasabah full name, masked BCA ID (`MA*********6`), and last login timestamp | Persona profile data | Displays personalized greeting | Fallback to default user if unauthenticated | `full-website-code.html:260` (`app-dashboard-greeting`) |
| 6 | Dashboard | Account Balance Card | Displays account type (Tahapan - IDR), Account No, and formatted balance with eye toggle | Account object (number, balance) | Balance value or masked bullet indicators (`●●●●●●`) | Default to masked on initial load | `full-website-code.html:260` (`app-dashboard-card-balance-v2`) |
| 7 | Dashboard | Balance Visibility Toggle | Eye icon button toggling masked bullets vs numeric currency display | Click on eye icon | Toggles between bullets and `Rp X.XXX.XXX,XX` | Retains state during session | `full-website-code.html:260` (`svg-icon-eye-slash-solid`) |
| 8 | Dashboard | Quick Banking Menus | 6 rounded card shortcuts: Transfer, Investment, Protection, Lifestyle, Paylater, More | Click on card | Opens feature modal / simulates transaction flow | Visual hover shadow-sm | `full-website-code.html:379` (`app-dashboard-banking-features`) |
| 9 | Dashboard | Mutasi / Transaction Activity | Authentic list card displaying category, merchant/desc, date, nominal, status badge | Transaction list array | List of cards with green (+) or red (-) amounts | Empty state message if 0 transactions | `full-website-code.html:379-450` (`app-dashboard-recent-transactions`) |
| 10 | ADAPT AI 1 | Propensity Recommendations | Rule-based affinity scoring based on current period transaction patterns with 1-click activation | Active transactions array, active features list | Ranked list of recommendation cards with match score % | Display "Semua Rekomendasi Utama Telah Aktif!" when 0 left | `full-website-code.html:617-660`, `algorithms.js` |
| 11 | ADAPT AI 2 | Life Event Smart Bundling | Detects baseline vs current shift and triggers bundling modal/banner when confidence >= 60% | Shift signals (e.g. Gaji + Sewa Kos) | Prominent banner & modal with multi-feature bundle activation | Banner remains hidden if confidence < 60% | `full-website-code.html:560-616`, `algorithms.js` |
| 12 | ADAPT AI 3 | Financial Health Gamification | Dynamic 0-100 weighted score with Bronze/Silver/Gold/Diamond badge and live recalculation | Active features, savings consistency, timeliness | Dynamic score circle, progress bar, tier badge, breakdown items | Clamped between 20 (base) and 100 | `full-website-code.html:265-295`, `algorithms.js` |
| 13 | Simulation Lab | Transaction Data Injector | Interactive form to inject new transactions directly into persistent database | Description, category, amount (Rp) | Updates DB, updates balance, triggers AI recalculation live | Form validation requires desc & amount > 0 | `full-website-code.html:315-378` (`#addTxForm`) |
| 14 | Simulation Lab | Audit Engine Inspector Drawer | Slide-out side drawer displaying mathematical formulas and real-time decision logs | Click "Mode Juri (Audit AI)" button | Drawer slides in from right (`.inspector-drawer.open`) | Closes on close button or backdrop click | `full-website-code.html:448-484` (`#inspectorDrawer`) |
| 15 | Simulation Lab | Preset Scenario Buttons | 1-click scenario triggers (Fresh Grad, Newlywed, Merchant) for live judge demonstrations | Click on scenario button | Injects scenario transactions, switches persona, recalculates | Shows error toast if scenario not found | `full-website-code.html:681-706` |
| 16 | System | 1-Click Database Reset | Admin/Judge tool to restore database back to initial seeds | Click Reset Database button | Resets all transactions, active features, and balances to seed | Confirmation toast displayed | `ORIGINAL_REQUEST.md` (R2/AC) |

---

## 3. Edge Cases & Observed Behavior

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Balance Masking Toggle | Click toggle repeatedly | Alternates between 6 SVG circles (`circle-small-solid`) and full formatted currency `Rp 14.500.000`. Icon toggles between eye and eye-slash. |
| 2 | Persona Switch | Switching persona during active session | Entire DOM re-renders: greeting name, BCA ID, account number, balance, mutasi list, gamification tier, and propensity feed change 100%. |
| 3 | Transaction Injection | Inject transaction with life-event keyword (e.g. "Sewa Kos") | Triggers pattern shift in Algoritma 2; confidence score crosses 60% threshold; life event banner dynamically mounts above dashboard grid. |
| 4 | Bundle 1-Click Activation | Click "Aktifkan Paket Bundle Sekaligus" | All bundle features appended to persona's `activeFeatures` array; Algoritma 3 recalculates score upwards (+bonus points); tier badge elevates live. |
| 5 | Propensity Feed Exhaustion | Activating all recommended features | List gracefully displays `<div class="text-center py-3 text-muted small"><i class="bi bi-check-circle text-success h4 d-block"></i> Semua Rekomendasi Utama Telah Aktif!</div>`. |
| 6 | Manual Login with Invalid Password | Wrong BCA ID or Password | Form group applies `.invalid`, turns underline red `#e25757`, displays error text without crashing. |
| 7 | Mobile Viewport (< 768px) | Screen width resized to 375px | Desktop greeting hides (`d-none d-md-block`), mobile greeting renders (`d-block d-md-none`), navbar collapses into hamburger toggling `.sidebar.open`. |

---

## 4. Authentic DOM Structure & Styling Specifications

### 4.1 Authentic Login Page DOM Structure
The login page uses the authentic `bg-auth` header and `.hero` layout with the signature underline form inputs:

```html
<section class="login-page bg-layout min-vh-100 d-flex flex-column justify-content-between">
  <!-- AUTHENTIC BG ORNAMENT -->
  <section class="icon-overlay container-lg"></section>

  <!-- AUTHENTIC HEADER (bg-auth has transparent background) -->
  <header class="bg-auth py-3">
    <div class="container-lg d-flex justify-content-between align-items-center">
      <a class="navbar-brand" href="/">
        <img src="./assets/img/brand/logo-white.svg" alt="myBCA Logo" height="36">
      </a>
      <div class="header-auth-badge text-white small font-weight-bold">
        <i class="bi bi-shield-check text-warning"></i> Secure Banking Portal
      </div>
    </div>
  </header>

  <!-- MAIN LOGIN HERO CONTAINER -->
  <main class="container-lg my-auto py-4">
    <div class="row align-items-center justify-content-center">
      
      <!-- LEFT HERO ILLUSTRATION & INTRO (Desktop) -->
      <div class="col-lg-6 d-none d-lg-block text-white pr-lg-5">
        <h2 class="font-weight-bold mb-3 display-5" style="color: #005caa;">Selamat Datang di myBCA</h2>
        <p class="lead text-muted mb-4" style="font-size: 1.15rem; line-height: 1.7;">
          Akses seluruh kendali finansial Anda dengan single BCA ID yang adaptif dan terpersonalisasi melalui teknologi AI ADAPT.
        </p>
        <div class="d-flex align-items-center gap-3">
          <div class="badge bg-primary text-white p-2 px-3 rounded-pill font-weight-bold">
            <i class="bi bi-cpu-fill"></i> Powered by myBCA ADAPT Engine
          </div>
        </div>
      </div>

      <!-- RIGHT: AUTHENTIC LOGIN CARD -->
      <div class="col-12 col-md-8 col-lg-5">
        <div class="card shadow border-0 rounded-lg overflow-hidden animated fadeIn">
          <div class="card-header bg-primary text-white text-center py-3 border-0">
            <h5 class="mb-0 font-weight-bold"><i class="bi bi-lock-fill mr-1"></i> Masuk ke myBCA</h5>
          </div>
          <div class="card-body p-4 p-md-5 bg-white">
            
            <!-- LOGIN FORM -->
            <form id="loginForm" autocomplete="off">
              
              <!-- BCA ID INPUT (Signature Underline) -->
              <div class="form-group mb-4 position-relative">
                <label for="inputBcaId" class="col-form-label">BCA ID</label>
                <input 
                  type="text" 
                  id="inputBcaId" 
                  name="bcaId" 
                  class="form-control" 
                  placeholder="Masukkan BCA ID Anda" 
                  required 
                  style="border-width: 0 0 1px 0; border-color: #dee2e6; border-radius: 0; padding-left: 0; font-size: 1rem; font-weight: 600;"
                >
              </div>

              <!-- PASSWORD INPUT (Signature Underline + Eye Toggle) -->
              <div class="form-group mb-4 position-relative">
                <label for="inputPassword" class="col-form-label">Password</label>
                <input 
                  type="password" 
                  id="inputPassword" 
                  name="password" 
                  class="form-control" 
                  placeholder="Masukkan Password" 
                  required 
                  style="border-width: 0 0 1px 0; border-color: #dee2e6; border-radius: 0; padding-left: 0; padding-right: 2rem; font-size: 1rem;"
                >
                <a href="javascript:;" id="toggleLoginPassword" class="text-muted" style="position: absolute; right: 0; bottom: 8px; cursor: pointer;">
                  <i class="bi bi-eye-slash" id="loginEyeIcon"></i>
                </a>
              </div>

              <!-- REMEMBER & FORGOT -->
              <div class="d-flex justify-content-between align-items-center mb-4 small">
                <div class="form-check">
                  <input type="checkbox" class="form-check-input" id="rememberMe">
                  <label class="form-check-label text-muted" for="rememberMe">Ingat BCA ID</label>
                </div>
                <a href="javascript:;" class="text-primary font-weight-bold">Lupa Password?</a>
              </div>

              <!-- SUBMIT BUTTON -->
              <button type="submit" id="loginSubmitBtn" class="btn btn-primary btn-block py-2 font-weight-bold shadow-sm" style="background-color: #005caa; border-color: #005caa; border-radius: 0.5rem; font-size: 1.05rem;">
                Masuk
              </button>
            </form>

            <!-- JUDGE QUICK SWITCHER / PERSONA HELPER -->
            <div class="mt-4 pt-3 border-top">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="small font-weight-bold text-dark"><i class="bi bi-lightning-charge-fill text-warning"></i> Mode Penguji / Quick Login:</span>
                <span class="badge bg-warning text-dark font-weight-bold" style="font-size: 0.65rem;">1-Click Persona</span>
              </div>
              <div class="persona-quick-grid d-flex flex-column gap-2" style="gap: 0.4rem;">
                <button type="button" class="btn btn-outline-primary btn-sm text-left d-flex justify-content-between align-items-center btn-quick-login py-1 px-2" data-persona="dimas">
                  <span><strong>Dimas</strong> (Fresh Graduate / Pekerja Baru)</span>
                  <i class="bi bi-arrow-right-short font-weight-bold"></i>
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm text-left d-flex justify-content-between align-items-center btn-quick-login py-1 px-2" data-persona="ayu">
                  <span><strong>Ayu</strong> (Rumah Tangga Baru)</span>
                  <i class="bi bi-arrow-right-short font-weight-bold"></i>
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm text-left d-flex justify-content-between align-items-center btn-quick-login py-1 px-2" data-persona="sari">
                  <span><strong>Sari</strong> (Merchant / Bisnis)</span>
                  <i class="bi bi-arrow-right-short font-weight-bold"></i>
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm text-left d-flex justify-content-between align-items-center btn-quick-login py-1 px-2" data-persona="rina">
                  <span><strong>Rina</strong> (Mahasiswa Aktif)</span>
                  <i class="bi bi-arrow-right-short font-weight-bold"></i>
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm text-left d-flex justify-content-between align-items-center btn-quick-login py-1 px-2" data-persona="bambang">
                  <span><strong>Bambang</strong> (Menjelang Pensiun)</span>
                  <i class="bi bi-arrow-right-short font-weight-bold"></i>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  </main>

  <!-- AUTHENTIC FOOTER -->
  <footer class="py-3 text-center text-muted small border-top bg-white">
    <div class="container-lg">
      PT Bank Central Asia Tbk berizin dan diawasi oleh Otoritas Jasa Keuangan (OJK) & Bank Indonesia. myBCA All Rights Reserved.
    </div>
  </footer>
</section>
```

### 4.2 Authentic Dashboard Greeting & Profile DOM Structure
```html
<app-dashboard-greeting>
  <app-card class="mb-3 animated card fadeIn">
    <app-card-body class="pb-4 card-body">
      
      <!-- DESKTOP GREETING (d-none d-md-block) -->
      <div class="form-row align-items-center mb-2 mb-md-4">
        <div class="col d-none d-md-block">
          <h5 class="font-weight-semibold">Hello, <span id="dashCustomerName">DIMAS PRASETYO</span></h5>
          <div class="d-flex align-items-center" style="line-height: 1rem;">
            <div class="text-break">
              <span class="mr-2">BCA ID</span>
              <span class="font-weight-semibold" id="dashBcaIdDisplay">DI*********8</span>
            </div>
            <div class="ml-2 d-flex align-items-center justify-content-center">
              <a href="javascript:;" id="toggleBcaIdMask" class="text-body">
                <svg-icon role="img" class="svg-icon-eye-slash-solid" style="font-size: 1.25rem;"><!-- SVG Eye Slash --></svg-icon>
              </a>
            </div>
          </div>
          <small class="text-muted" id="dashLastLogin">Last login 11 Sep 2026 21:18:54 UTC+7</small>
        </div>
        
        <!-- MOBILE GREETING (d-block d-md-none) -->
        <h5 class="col mb-0 font-weight-semibold d-block d-md-none">Hello, <span id="dashCustomerNameMobile">DIMAS PRASETYO</span></h5>
      </div>

      <!-- GREETING CONTAINER WITH TWO SIDES: BALANCE CARD & QUICK FEATURES -->
      <div class="greeting-container">
        
        <!-- LEFT: ACCOUNT BALANCE CARD -->
        <div class="pr-lg-0">
          <app-dashboard-card-balance-v2 class="mb-3 mb-lg-0 h-100">
            <app-card class="shadow-none h-100 animated card fadeIn">
              <app-card-body class="border rounded shadow-sm p-0 d-flex flex-column card-body">
                
                <!-- TOP HEADER: ACCOUNT TYPE & NUMBER -->
                <div class="rounded-top border-bottom bg-light">
                  <a class="d-flex justify-content-between px-3 py-2 text-primary" href="/profile/balance">
                    <div>
                      <div class="font-weight-semibold" id="dashAccountType">TAHAPAN - IDR</div>
                      <strong id="dashAccountNo">8820491823</strong>
                    </div>
                    <div class="d-flex align-items-center" style="width: 1rem;">
                      <svg-icon role="img" class="h4 mb-0 svg-icon-chevron-right-solid" style="font-size: 1.25rem;"><!-- SVG Chevron --></svg-icon>
                    </div>
                  </a>
                </div>

                <!-- BOTTOM BODY: BALANCE VALUE & EYE TOGGLE -->
                <div class="flex-fill d-flex align-items-center justify-content-between p-3 py-lg-4">
                  <div class="d-flex align-items-center">
                    <h5 class="mb-0 mr-2 font-weight-normal">IDR</h5>
                    <!-- MASKED STATE (Default) -->
                    <div id="balanceMaskedGroup" class="d-flex align-items-center">
                      <svg-icon class="h4 mb-0 svg-icon-circle-small-solid"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg-icon>
                      <svg-icon class="h4 mb-0 svg-icon-circle-small-solid"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg-icon>
                      <svg-icon class="h4 mb-0 svg-icon-circle-small-solid"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg-icon>
                      <svg-icon class="h4 mb-0 svg-icon-circle-small-solid"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg-icon>
                      <svg-icon class="h4 mb-0 svg-icon-circle-small-solid"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg-icon>
                      <svg-icon class="h4 mb-0 svg-icon-circle-small-solid"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg-icon>
                    </div>
                    <!-- UNMASKED NUMERIC STATE -->
                    <div id="balanceNumericGroup" class="d-none font-weight-bold h4 mb-0 text-primary">
                      <span id="dashBalanceValue">14.500.000,00</span>
                    </div>
                  </div>
                  <a href="javascript:;" id="btnToggleBalance" class="text-body d-flex align-items-center" title="Tampilkan/Sembunyikan Saldo">
                    <svg-icon id="balanceEyeSvg" class="svg-icon-eye-slash-solid" style="font-size: 1.5rem;"><!-- SVG Eye Slash --></svg-icon>
                  </a>
                </div>

              </app-card-body>
            </app-card>
          </app-dashboard-card-balance-v2>
        </div>

        <!-- RIGHT: BANKING FEATURES (6 QUICK SHORTCUTS) -->
        <div class="pl-lg-0">
          <app-dashboard-banking-features class="d-block h-100">
            <div class="banking-feature-container h-100">
              <!-- 1. Transfer -->
              <div>
                <a class="d-flex p-3 align-items-center border shadow-sm rounded h-100" href="javascript:void(0);" onclick="openQuickAction('Transfer')">
                  <div class="position-relative mr-2"><svg-icon class="icon text-primary svg-icon-transfer-solid" style="font-size: 2rem;"><!-- SVG Transfer --></svg-icon></div>
                  <span class="font-weight-semibold">Transfer</span>
                </a>
              </div>
              <!-- 2. Investment -->
              <div>
                <a class="d-flex p-3 align-items-center border shadow-sm rounded h-100" href="javascript:void(0);" onclick="openQuickAction('Investment')">
                  <div class="position-relative mr-2"><svg-icon class="icon text-teal svg-icon-welma-solid" style="font-size: 2rem;"><!-- SVG Welma --></svg-icon></div>
                  <span class="font-weight-semibold">Investment Portfolio</span>
                </a>
              </div>
              <!-- 3. Protection -->
              <div>
                <a class="d-flex p-3 align-items-center border shadow-sm rounded h-100" href="javascript:void(0);" onclick="openQuickAction('Protection')">
                  <div class="position-relative mr-2"><svg-icon class="icon text-teal svg-icon-insurance-solid" style="font-size: 2rem;"><!-- SVG Insurance --></svg-icon></div>
                  <span class="font-weight-semibold">Protection</span>
                </a>
              </div>
              <!-- 4. Lifestyle -->
              <div>
                <a class="d-flex p-3 align-items-center border shadow-sm rounded h-100" href="javascript:void(0);" onclick="openQuickAction('Lifestyle')">
                  <div class="position-relative mr-2"><svg-icon class="icon text-blue svg-icon-two-shopping-bags-solid" style="font-size: 2rem;"><!-- SVG Bags --></svg-icon></div>
                  <span class="font-weight-semibold">Lifestyle</span>
                </a>
              </div>
              <!-- 5. Paylater -->
              <div>
                <a class="d-flex p-3 align-items-center border shadow-sm rounded h-100" href="javascript:void(0);" onclick="openQuickAction('Paylater')">
                  <div class="position-relative mr-2"><svg-icon class="icon text-orange svg-icon-wallet-clock-solid" style="font-size: 2rem;"><!-- SVG Paylater --></svg-icon></div>
                  <span class="font-weight-semibold">Paylater</span>
                </a>
              </div>
              <!-- 6. More -->
              <div>
                <a class="d-flex p-3 align-items-center border shadow-sm rounded h-100" href="javascript:void(0);" onclick="openQuickAction('More')">
                  <svg-icon class="icon mr-2 text-primary svg-icon-ellipsis-circle-solid" style="font-size: 2rem;"><!-- SVG Ellipsis --></svg-icon>
                  <span class="font-weight-semibold">More</span>
                </a>
              </div>
            </div>
          </app-dashboard-banking-features>
        </div>

      </div>

    </app-card-body>
  </app-card>
</app-dashboard-greeting>
```

### 4.3 Authentic Mutasi Transaction List DOM Structure
```html
<app-dashboard-transaction-tab>
  <app-card class="animated fadeIn h-100 overflow-hidden card">
    <app-card-body class="p-0 card-body">
      <div class="tab-container">
        <ul class="nav nav-tabs nav-justified" role="tablist">
          <li class="nav-item active"><a class="nav-link active" href="javascript:;">Transaction Activity</a></li>
          <li class="nav-item"><a class="nav-link" href="javascript:;">Favorite Transactions</a></li>
        </ul>
        <div class="tab-content p-4">
          <app-dashboard-recent-transactions id="recentTransactionsList">
            <!-- REPEATING AUTHENTIC TRANSACTION CARD -->
            <div class="rounded border shadow-sm p-3 mb-3">
              <div class="form-row mb-1">
                <div class="col-8 text-line-clamp line-2 text-primary font-weight-bold">
                  <span>${tx.category}</span>
                </div>
                <div class="col-4 text-right">
                  <small class="text-muted">${tx.date}</small>
                  <div class="font-weight-bold text-nowrap">
                    <span class="mr-1">IDR</span>
                    <span class="${isPos ? 'text-success' : 'text-danger'}">
                      ${isPos ? '+' : '-'} ${tx.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="col-8 font-weight-semibold text-line-clamp line-1 text-dark">
                  <i class="bi ${tx.icon || 'bi-receipt'} text-primary mr-1"></i>
                  <span>${tx.desc}</span>
                </div>
                <div class="col-4 text-right">
                  <small class="font-weight-bold text-success"> Berhasil </small>
                </div>
              </div>
            </div>
          </app-dashboard-recent-transactions>
        </div>
      </div>
    </app-card-body>
  </app-card>
</app-dashboard-transaction-tab>
```

### 4.4 Authentic Smart Bundling Modal & Banner DOM Structure
```html
<!-- LIFE EVENT BANNER (Mounted above or inside dashboard) -->
<div class="adapt-bundle-banner mb-3 p-3 rounded-lg text-white shadow-sm animated pulse" style="background: linear-gradient(135deg, #005caa 0%, #0094d6 100%); border-left: 6px solid #ffc107;">
  <div class="d-flex justify-content-between align-items-center">
    <div class="d-flex align-items-center gap-3">
      <div class="bundle-icon-badge bg-warning text-dark p-3 rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; font-size: 1.5rem;">
        <i class="bi bi-gift-fill"></i>
      </div>
      <div>
        <div class="badge badge-warning text-dark font-weight-bold mb-1">
          <i class="bi bi-stars"></i> Life Event Detected (Confidence: ${confidence}%)
        </div>
        <h5 class="mb-0 font-weight-bold">${rule.bundleName}</h5>
        <div class="small text-white-50">${rule.bannerDesc}</div>
      </div>
    </div>
    <button class="btn btn-warning font-weight-bold shadow-sm" onclick="openBundleModal('${rule.bundleId}')">
      <i class="bi bi-eye-fill"></i> Lihat Penawaran
    </button>
  </div>
</div>

<!-- AUTHENTIC MODAL (Using combined-styles-komplit.css .modal & .modal-dialog classes) -->
<div class="modal fade show" id="smartBundleModal" tabindex="-1" style="display: none; background: rgba(0,0,0,0.5); z-index: 1050;">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content shadow-lg border-0" style="border-radius: 0.75rem;">
      
      <!-- MODAL HEADER -->
      <div class="modal-header bg-light border-bottom py-3">
        <h5 class="modal-title font-weight-bold text-primary">
          <i class="bi bi-lightning-charge-fill text-warning mr-1"></i> Rekomendasi Bundle myBCA ADAPT
        </h5>
        <button type="button" class="close" onclick="closeBundleModal()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <!-- MODAL BODY -->
      <div class="modal-body p-4">
        <div class="text-center mb-3">
          <span class="badge badge-pill badge-warning px-3 py-1 font-weight-bold text-dark">
            Deteksi Sinyal: ${rule.detectedSignals.join(', ')}
          </span>
          <h4 class="font-weight-bold text-dark mt-2">${rule.bundleName}</h4>
          <p class="text-muted small">${rule.fullDescription}</p>
        </div>

        <!-- BUNDLED FEATURES LIST -->
        <div class="list-group mb-3">
          <!-- Dynamic Feature items -->
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <i class="bi bi-check-circle-fill text-success mr-2 h5 mb-0"></i>
              <div>
                <strong>${feature.name}</strong>
                <div class="small text-muted">${feature.desc}</div>
              </div>
            </div>
            <span class="badge badge-primary font-weight-bold">+${feature.points} Poin</span>
          </div>
        </div>

        <!-- BONUS CALLOUT -->
        <div class="alert alert-info border-0 text-center small font-weight-bold mb-0">
          🎁 Bonus Khusus Paket: Tambahan +${rule.bonusPoints} Poin Kesehatan Finansial saat diaktifkan sekaligus!
        </div>
      </div>

      <!-- MODAL FOOTER -->
      <div class="modal-footer bg-light border-top py-2">
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeBundleModal()">Nanti Saja</button>
        <button type="button" id="btnClaimBundle" class="btn btn-primary btn-sm font-weight-bold px-3" onclick="claimActiveBundle()">
          <i class="bi bi-check-lg mr-1"></i> Aktifkan Bundle Sekarang (+${rule.bonusPoints} PTS)
        </button>
      </div>

    </div>
  </div>
</div>
```

---

## 5. Inline SVG Icon Specifications (100% Offline & Authentic)

All 12 icons from `full-website-code.html` can be rendered without external image dependencies:

1. `svg-icon-exit-door-solid` (Logout Button):
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="100%" width="100%"><path fill="currentColor" fill-rule="evenodd" d="M12.598 2h-8.7l2.796 2.122h5.208a.4.4 0 0 1 .402.398v2.336a.4.4 0 0 0 .401.399h1.338a.4.4 0 0 0 .401-.399V4c0-1.072-.818-1.947-1.847-1.999M7.887 7.175s1.23 1.219 1.23 2.885v10.49c0 .882-.891 1.516-1.836 1.445a1.46 1.46 0 0 1-.84-.37c-.703-.613-2.58-2.25-3.432-3.009a2.9 2.9 0 0 1-.744-.986A3.1 3.1 0 0 1 2 16.367V5.062c0-1.138.712-1.985.712-1.985zm4.766 6.362h1.378c.228 0 .413.183.413.41v3.423c0 1.104-.843 2.006-1.902 2.06h-2.308v-2.187h1.592a.41.41 0 0 0 .413-.41v-2.886c0-.227.185-.41.414-.41m6.306-6.57 2.774 2.751a.84.84 0 0 1 0 1.227l-2.774 2.751c-.355.353-.896.368-1.252.015-.341-.34-.299-.903.028-1.242l1.253-1.227h-6.414a.85.85 0 0 1-.64-.282c-.399-.423-.3-1.171.214-1.453a.9.9 0 0 1 .426-.113h6.414s-1.238-1.228-1.253-1.228c-.327-.324-.369-.903-.028-1.227.342-.338.897-.325 1.252.028" clip-rule="evenodd"></path></svg>
   ```
2. `svg-icon-eye-slash-solid` (Balance & Password Toggle):
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35" height="100%" width="100%"><g fill="none" fill-rule="evenodd"><g stroke="currentColor" stroke-linecap="round"><path stroke-linejoin="round" stroke-width="2" d="M11.732 24.551q2.965 1.547 5.933 1.546 6.964 0 13.9-8.5-4.17-4.45-6.664-6.236m-4.237-1.978a11.6 11.6 0 0 0-2.984-.397q-6.95 0-13.912 8.612 3.15 3.285 4.365 4.379"></path><path stroke-width="1.75" d="M21.119 15.325a4.45 4.45 0 0 1 .586 2.216c0 2.363-1.818 4.277-4.06 4.277-.76 0-1.474-.218-2.082-.603m-1.978-3.674c0-2.362 1.817-4.278 4.06-4.278"></path><path stroke-width="2" d="M27 8 8 27"></path></g><path d="M0 0h35v35H0z"></path></g></svg>
   ```
3. `svg-icon-circle-small-solid` (Masked Balance Dot):
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="100%" width="100%"><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg>
   ```
4. `svg-icon-chevron-right-solid` (Card Arrow):
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="100%" width="100%"><path fill="currentColor" d="M9.707 5.293a1 1 0 0 0-1.414 1.414zM15 12l.707.707a1 1 0 0 0 0-1.414zm-6.707 5.293a1 1 0 1 0 1.414 1.414zm0-10.586 6 6 1.414-1.414-6-6zm6 4.586-6 6 1.414 1.414 6-6z"></path></svg>
   ```
5. `svg-icon-transfer-solid` (Transfer Shortcut):
   `M30.868 18.87a2.1 2.1 0 0 1 1.434.5L44.996 30.2...`
6. `svg-icon-welma-solid` (Investment Shortcut):
   `M5.2 1.6a3.6 3.6 0 0 0-3.6 3.6v21.6...`
7. `svg-icon-insurance-solid` (Protection Shortcut):
   `M2.897 5.318C1.283 5.438 0 6.768 0 8.388V25.99...`
8. `svg-icon-two-shopping-bags-solid` (Lifestyle Shortcut):
   `M4.697 9.128a2.4 2.4 0 0 1 2.39-2.192h12.658...`
9. `svg-icon-wallet-clock-solid` (Paylater Shortcut):
   `M12.676 7.423h31.498l-1.121-4.59...`
10. `svg-icon-ellipsis-circle-solid` (More Features):
    `<rect width="6" height="6" x="2.334" y="13" fill="currentColor" rx="3"></rect>...`

---

## 6. Recommendations for Node.js / Express Fullstack Integration

To ensure robust persistence, smooth reactivity, and 1-click testability for judges:

### 6.1 State & Session Architecture
1. **Single-Page Dynamic State or Multi-Route**:
   - Serve the application via Express:
     - `GET /`: Serves the application with initial state check (if token/cookie present -> renders Dashboard; otherwise -> renders authentic Login).
     - Alternatively, an active UI state switcher in JavaScript (`#viewLogin` vs `#viewDashboard`) within the same template for instant transitions without full-page reloads.
2. **5 Preset Personas Data Mapping**:
   | Persona ID | BCA ID | Name | Role / Life Stage | Initial Balance | Initial Tier | Seed Features |
   |------------|--------|------|-------------------|-----------------|--------------|---------------|
   | `dimas` | `DIMAS23` | Dimas Prasetyo | Fresh Graduate (Junior Dev) | Rp 14.500.000 | Bronze (55) | `paylater_reminder` |
   | `ayu` | `AYUR28` | Ayu Ratnasari | Newlywed (Marketing) | Rp 38.200.000 | Silver (75) | `auto_save`, `family_budgeting` |
   | `sari` | `SARIW35` | Hj. Sari Wijaya | Merchant / Catering Owner | Rp 125.400.000 | Gold (85) | `qris_merchant`, `cashflow_report` |
   | `rina` | `RINA20` | Rina Kartika | Mahasiswi Aktif S1 | Rp 3.400.000 | Bronze (40) | `student_savings` |
   | `bambang` | `BAMBANG56` | Drs. Bambang Hariyanto | Senior Manager / Pre-Retirement | Rp 245.000.000 | Diamond (95) | `auto_save`, `conservative_invest`, `welma_portfolio` |

### 6.2 REST API Contracts Recommended for Backend
- `POST /api/auth/login`: Accepts `{ bcaId, password }`. Validates against DB personas. Returns session token + user profile.
- `POST /api/auth/logout`: Clears session token.
- `GET /api/user/profile`: Returns active persona profile, accounts, and active features.
- `GET /api/transactions`: Returns list of transactions for active account (baseline and current period).
- `POST /api/transactions/inject`: Injects a manual or scenario transaction `{ category, desc, amount }`. Updates account balance and persists to DB.
- `POST /api/features/activate`: Activates feature `{ featureId }` for active user. Persists to DB and triggers recalculation.
- `POST /api/bundles/claim`: Activates all bundled features in 1 click `{ bundleId }`.
- `GET /api/ai/audit-stream`: Returns live logs and decision metrics for the Audit Drawer.
- `POST /api/system/reset`: Re-seeds the entire database back to pristine initial state (mandatory for demo reset).

### 6.3 Database Store Recommendation
- Use **SQLite** (via `better-sqlite3` or `sqlite3`) or a **Relational JSON Persistent Store** with automatic file flush.
- Tables:
  1. `users`: `id`, `bca_id`, `password_hash`, `name`, `title`, `age`, `avatar`, `timeliness_rate`, `savings_consistency`
  2. `accounts`: `id`, `user_id`, `account_no`, `account_type`, `balance`, `currency`
  3. `transactions`: `id`, `user_id`, `account_no`, `period` (`baseline` / `current`), `date`, `category`, `desc`, `amount`, `is_positive`, `icon`
  4. `user_features`: `user_id`, `feature_id`, `activated_at`
  5. `life_events`: `id`, `user_id`, `event_type`, `confidence`, `detected_at`, `is_dismissed`, `is_claimed`

---
*Report completed and verified against full-website-code.html and combined-styles-komplit.css.*
