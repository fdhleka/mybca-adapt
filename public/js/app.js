/**
 * ==============================================================================
 * myBCA ADAPT — Single Page Application (SPA) Frontend Controller
 * ==============================================================================
 * Connects authentic myBCA UI with Express backend REST APIs & 3 AI Engines:
 * - Milestone 2: Authentic Login & Judge Quick Switcher
 * - Milestone 3: Reactive Dashboard & Dynamic Data Binding
 * - Milestone 4: 3 AI Engines Real-Time UI (Propensity, Bundling, Gamification)
 * - Milestone 5: Interactive Simulation Lab & Audit Engine Inspector
 * ==============================================================================
 */

(function () {
  'use strict';

  // --- Global Application State ---
  const state = {
    token: localStorage.getItem('mybca_token') || null,
    user: null,
    account: null,
    personas: [],
    transactions: [],
    activePeriod: 'current',
    aiStatus: null,
    scenarios: [],
    auditLogs: [],
    isBalanceMasked: true,
    isBcaIdMasked: true,
    isInspectorOpen: false,
    activeBundle: null,
    vouchers: [],
    voucherFilter: 'all',
    selectedClaimedVoucher: null,
    adminVouchers: []
  };

  // --- API Client Helper ---
  async function apiFetch(endpoint, options = {}) {
    const headers = {
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.message || `HTTP Error ${response.status}`;
        const err = new Error(errorMsg);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      console.error(`[API ERROR] ${options.method || 'GET'} ${endpoint}:`, err);
      throw err;
    }
  }

  // --- Formatting Utilities ---
  function formatIDR(amount) {
    if (typeof amount !== 'number') amount = parseInt(amount, 10) || 0;
    return amount.toLocaleString('id-ID');
  }

  function maskBcaId(idStr) {
    if (!idStr) return '••••••••';
    const s = idStr.toString();
    if (s.length <= 4) return s;
    return s.slice(0, 2) + '*'.repeat(Math.max(4, s.length - 3)) + s.slice(-1);
  }

  function formatDateTime(isoString) {
    if (!isoString) {
      const now = new Date();
      return `${now.getDate()} Sep 2026 ${now.toTimeString().slice(0, 8)} UTC+7`;
    }
    const d = new Date(isoString);
    return `${d.getDate()} Sep 2026 ${d.toTimeString().slice(0, 8)} UTC+7`;
  }

  // --- Toast Notification Helper ---
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-adapt';
    if (type === 'error') {
      toast.style.background = '#dc2626';
    } else if (type === 'warning') {
      toast.style.background = '#d97706';
    }

    const icon = type === 'error' ? 'bi-exclamation-triangle-fill' : (type === 'warning' ? 'bi-bell-fill' : 'bi-check-circle-fill');
    toast.innerHTML = `<i class="bi ${icon} h5 mb-0"></i> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // --- View Transition Controller ---
  function switchView(viewName) {
    const viewLogin = document.getElementById('viewLogin');
    const viewDashboard = document.getElementById('viewDashboard');
    const mainBottomNav = document.getElementById('mainBottomNav');
    const deviceFrame = document.getElementById('deviceFrame');
    const mobileStatusBar = document.getElementById('mobileStatusBar');

    if (viewName === 'dashboard') {
      viewLogin.classList.add('view-hidden');
      viewDashboard.classList.remove('view-hidden');
      if (mainBottomNav) mainBottomNav.classList.remove('d-none');
      if (deviceFrame) deviceFrame.classList.remove('login-mode-frame');
      if (mobileStatusBar) mobileStatusBar.classList.add('status-bar-dark');
    } else {
      viewDashboard.classList.add('view-hidden');
      viewLogin.classList.remove('view-hidden');
      if (mainBottomNav) mainBottomNav.classList.add('d-none');
      if (deviceFrame) deviceFrame.classList.add('login-mode-frame');
      if (mobileStatusBar) mobileStatusBar.classList.remove('status-bar-dark');
    }
  }

  // ==========================================================================
  // Milestone 2: Authentic Login & Judge Quick Switcher
  // ==========================================================================

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const alertBox = document.getElementById('loginErrorAlert');
    alertBox.classList.add('d-none');

    const bcaIdInput = document.getElementById('inputBcaId');
    const passwordInput = document.getElementById('inputPassword');

    const bca_id = bcaIdInput.value.trim();
    const password = passwordInput.value;

    const submitBtn = document.getElementById('loginSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm mr-1"></span> Memproses...';

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { bca_id, password }
      });

      const token = res.token || res.data?.token;
      const user = res.user || res.data?.user;
      const account = res.account || res.data?.account;

      if (!token) throw new Error('Token tidak ditemukan dalam respons autentikasi.');

      state.token = token;
      state.user = user;
      state.account = account;
      localStorage.setItem('mybca_token', token);

      showToast(`Selamat datang kembali, ${user.name}!`);
      switchView('dashboard');
      await loadDashboardData();
      if (user.id === 'admin') {
        openAdminVoucherModal();
      }
    } catch (err) {
      alertBox.textContent = err.message || 'BCA ID atau Password salah.';
      alertBox.classList.remove('d-none');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right mr-1"></i> Masuk';
    }
  }

  async function handleQuickLogin(personaId) {
    const alertBox = document.getElementById('loginErrorAlert');
    if (alertBox) alertBox.classList.add('d-none');

    try {
      const res = await apiFetch('/api/auth/quick-login', {
        method: 'POST',
        body: { persona_id: personaId }
      });

      const token = res.token || res.data?.token;
      const user = res.user || res.data?.user;
      const account = res.account || res.data?.account;

      if (!token) throw new Error('Gagal mendapatkan token quick login.');

      state.token = token;
      state.user = user;
      state.account = account;
      localStorage.setItem('mybca_token', token);

      showToast(`⚡ Quick-Login aktif: ${user.name} (${user.title})`);
      switchView('dashboard');
      await loadDashboardData();
      if (user.id === 'admin') {
        openAdminVoucherModal();
      }
    } catch (err) {
      showToast(`Quick-login gagal: ${err.message}`, 'error');
    }
  }

  async function handleLogout() {
    try {
      if (state.token) {
        await apiFetch('/api/auth/logout', { method: 'POST' });
      }
    } catch {
      // Graceful offline fallback
    } finally {
      state.token = null;
      state.user = null;
      state.account = null;
      localStorage.removeItem('mybca_token');

      const bcaIdInput = document.getElementById('inputBcaId');
      const passwordInput = document.getElementById('inputPassword');
      if (bcaIdInput) bcaIdInput.value = '';
      if (passwordInput) passwordInput.value = '';

      switchView('login');
      showToast('Anda telah keluar dari sesi myBCA.');
    }
  }

  // ==========================================================================
  // Milestone 3: Reactive Dashboard & Dynamic Data Binding
  // ==========================================================================

  async function loadDashboardData() {
    try {
      // 1. Fetch Account Details
      try {
        const accRes = await apiFetch('/api/accounts/me');
        state.account = accRes.data || accRes;
      } catch (err) {
        console.warn('Could not load account details:', err);
      }

      // 2. Fetch Multi-period Transactions
      await fetchTransactions(state.activePeriod);

      // 3. Fetch 3 AI Engines Status
      await fetchAIStatus();

      // 4. Fetch Simulation Scenarios Catalog
      try {
        const scenRes = await apiFetch('/api/simulation/scenarios');
        state.scenarios = scenRes.data || scenRes;
      } catch (err) {
        console.warn('Could not load scenarios:', err);
      }

      // 5. Fetch Audit Logs
      await fetchAuditLogs();

      // 6. Fetch Vouchers & Target Quests
      await fetchVouchers();

      // Render Everything to DOM
      renderAll();
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      showToast('Terjadi kesalahan memuat data dashboard.', 'error');
    }
  }

  async function fetchVouchers() {
    try {
      const vRes = await apiFetch('/api/vouchers');
      state.vouchers = vRes.data || [];
    } catch (err) {
      console.warn('Failed to fetch vouchers:', err);
      state.vouchers = [];
    }
  }

  async function fetchTransactions(period = 'current') {
    state.activePeriod = period;
    try {
      const txRes = await apiFetch(`/api/transactions?period=${period}&limit=50`);
      state.transactions = txRes.data || txRes || [];
    } catch (err) {
      console.warn('Failed to fetch transactions:', err);
      state.transactions = [];
    }
  }

  async function fetchAIStatus() {
    try {
      const aiRes = await apiFetch('/api/ai/status');
      state.aiStatus = aiRes.data || aiRes;
    } catch (err) {
      console.warn('Failed to fetch AI status:', err);
      state.aiStatus = null;
    }
  }

  async function fetchAuditLogs() {
    try {
      const logRes = await apiFetch('/api/ai/audit-logs?limit=40');
      state.auditLogs = logRes.data || logRes || [];
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
      state.auditLogs = [];
    }
  }

  function renderAll() {
    renderCustomerHeader();
    renderAccountBalanceCard();
    renderMutasiHistory();
    renderCashflow();
    renderGamificationCard();
    renderRecommendationsFeed();
    renderLifeEventBanner();
    renderScenarioButtons();
    renderAuditLogs();
    renderVouchersSection();
  }

  function renderCustomerHeader() {
    const user = state.user;
    if (!user) return;

    const nameEl = document.getElementById('dashCustomerName');
    if (nameEl) nameEl.textContent = user.name ? user.name.toUpperCase() : 'NASABAH BCA';

    const bcaIdEl = document.getElementById('dashBcaIdDisplay');
    if (bcaIdEl) {
      bcaIdEl.textContent = state.isBcaIdMasked ? maskBcaId(user.bca_id) : user.bca_id.toUpperCase();
    }

    const bcaEye = document.getElementById('bcaIdEyeIcon');
    if (bcaEye) {
      bcaEye.className = state.isBcaIdMasked ? 'bi bi-eye-slash' : 'bi bi-eye';
    }

    const lastLoginEl = document.getElementById('dashLastLogin');
    if (lastLoginEl) {
      lastLoginEl.textContent = `Last login ${formatDateTime()}`;
    }

    const avatarEl = document.getElementById('dashUserAvatar');
    if (avatarEl) {
      avatarEl.src = user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    }

    const titleBadge = document.getElementById('dashUserTitleBadge');
    if (titleBadge) {
      titleBadge.textContent = `${user.title || user.occupation || 'Nasabah Utama'}`;
    }

    // Update Persona Selector in Navbar
    const personaSelect = document.getElementById('dashPersonaSelect');
    if (personaSelect && state.personas.length > 0) {
      personaSelect.value = user.id;
    }

    // Role-based voucher management UI visibility
    const voucherPageAdminShortcut = document.getElementById('voucherPageAdminShortcut');
    if (voucherPageAdminShortcut) {
      if (user.id === 'admin') {
        voucherPageAdminShortcut.classList.remove('d-none');
      } else {
        voucherPageAdminShortcut.classList.add('d-none');
      }
    }

    const adminVoucherBtn = document.getElementById('btnOpenAdminVouchers');
    const adminVoucherBadge = document.getElementById('adminVoucherAccessBadge');
    if (adminVoucherBtn) {
      if (user.id === 'admin') {
        adminVoucherBtn.style.opacity = '1';
        if (adminVoucherBadge) {
          adminVoucherBadge.className = 'badge badge-success font-weight-bold ml-auto';
          adminVoucherBadge.innerHTML = '<i class="bi bi-shield-check mr-1"></i>Akses Penuh';
        }
      } else {
        adminVoucherBtn.style.opacity = '0.75';
        if (adminVoucherBadge) {
          adminVoucherBadge.className = 'badge badge-warning text-dark font-weight-bold ml-auto';
          adminVoucherBadge.innerHTML = '<i class="bi bi-lock-fill mr-1"></i>Khusus Admin';
        }
      }
    }
  }

  function renderAccountBalanceCard() {
    const acc = state.account;
    if (!acc) return;

    const typeEl = document.getElementById('dashAccountType');
    if (typeEl) typeEl.textContent = `${(acc.account_type || 'TAHAPAN').toUpperCase()} - ${acc.currency || 'IDR'}`;

    const noEl = document.getElementById('dashAccountNo');
    if (noEl) noEl.textContent = acc.account_no || acc.account_number || '8820491823';

    const valEl = document.getElementById('dashBalanceValue');
    if (valEl) valEl.textContent = formatIDR(acc.balance);

    const maskedGroup = document.getElementById('balanceMaskedGroup');
    const numericGroup = document.getElementById('balanceNumericGroup');
    const eyeIcon = document.getElementById('balanceEyeIcon');

    if (state.isBalanceMasked) {
      if (maskedGroup) {
        maskedGroup.classList.remove('d-none');
        maskedGroup.style.setProperty('display', 'flex', 'important');
      }
      if (numericGroup) {
        numericGroup.classList.add('d-none');
        numericGroup.style.setProperty('display', 'none', 'important');
      }
      if (eyeIcon) eyeIcon.className = 'bi bi-eye-slash-fill';
    } else {
      if (maskedGroup) {
        maskedGroup.classList.add('d-none');
        maskedGroup.style.setProperty('display', 'none', 'important');
      }
      if (numericGroup) {
        numericGroup.classList.remove('d-none');
        numericGroup.style.setProperty('display', 'inline-block', 'important');
      }
      if (eyeIcon) eyeIcon.className = 'bi bi-eye-fill';
    }
  }

  function renderMutasiHistory() {
    const tbody = document.getElementById('txTableBody');
    const badge = document.getElementById('txCountBadge');
    const metaBadge = document.getElementById('txPeriodBadgeMeta');
    if (!tbody) return;

    const txs = state.transactions || [];
    if (badge) badge.textContent = `${txs.length} Transaksi (${state.activePeriod.toUpperCase()})`;
    if (metaBadge) metaBadge.textContent = `${txs.length} Transaksi (${state.activePeriod.toUpperCase()})`;

    if (txs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-muted small">
            <i class="bi bi-inbox text-muted h4 d-block mb-1"></i>
            Tidak ada transaksi untuk periode ${state.activePeriod}.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    txs.forEach(tx => {
      const isPos = tx.type === 'CR' || (tx.category && (tx.category.includes('Masuk') || tx.category.includes('Gaji') || tx.category.includes('QRIS')));
      const sign = isPos ? '+' : '-';
      const icon = tx.icon || (isPos ? 'bi-arrow-down-left-circle-fill' : 'bi-arrow-up-right-circle-fill');

      html += `
        <tr>
          <td colspan="4" class="p-0 border-0">
            <div class="m-tx-item">
              <div class="m-tx-left">
                <div class="m-tx-icon-box ${isPos ? 'm-tx-icon-cr' : 'm-tx-icon-db'}">
                  <i class="bi ${icon}"></i>
                </div>
                <div class="m-tx-info">
                  <div class="m-tx-desc">${tx.description || tx.desc || '-'}</div>
                  <div class="m-tx-meta">
                    <span>${tx.date}</span> • <span class="badge-cat-tag">${tx.category || 'Transaksi'}</span>
                  </div>
                </div>
              </div>
              <div class="m-tx-right">
                <div class="${isPos ? 'm-tx-amount-cr' : 'm-tx-amount-db'}">
                  ${sign} Rp ${formatIDR(tx.amount)}
                </div>
                <span class="badge ${isPos ? 'badge-success' : 'badge-danger'} m-tx-badge">${tx.type || (isPos ? 'CR' : 'DB')}</span>
              </div>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

    // Update active state on period tabs (supports both .m-mutasi-pill and standard buttons)
    const periodButtons = document.querySelectorAll('#txPeriodTabs button');
    periodButtons.forEach(btn => {
      const isActive = btn.getAttribute('data-period') === state.activePeriod;
      if (btn.classList.contains('m-mutasi-pill')) {
        btn.classList.toggle('active', isActive);
      } else {
        btn.className = isActive 
          ? 'btn btn-primary btn-sm active font-weight-bold' 
          : 'btn btn-outline-primary btn-sm font-weight-bold';
      }
    });
  }

  // --- Cashflow Engine: Arus Kas & Analisis Pemasukan vs Pengeluaran ---
  function renderCashflow() {
    const txs = state.transactions || [];
    let totalIn = 0;
    let totalOut = 0;

    txs.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      const isPos = tx.type === 'CR' || (tx.category && (tx.category.includes('Masuk') || tx.category.includes('Gaji') || tx.category.includes('QRIS') || tx.category.includes('Payroll')));
      if (isPos) totalIn += amt;
      else totalOut += amt;
    });

    const net = totalIn - totalOut;
    const totalFlow = totalIn + totalOut;
    const inPercent = totalFlow > 0 ? Math.round((totalIn / totalFlow) * 100) : 50;
    const outPercent = 100 - inPercent;

    // SVG Donut Circle Geometry: r=38, C = 2 * PI * 38 = 238.76
    const C = 238.76;
    const inDash = (inPercent / 100) * C;
    const outDash = (outPercent / 100) * C;

    // 1. Home widget elements
    const homeIn = document.getElementById('cashflowHomeIn');
    const homeOut = document.getElementById('cashflowHomeOut');
    const homeNet = document.getElementById('cashflowHomeNet');
    const homeBadge = document.getElementById('cashflowHomeBadge');
    const homeBarIn = document.getElementById('cashflowBarIn');
    const homeBarOut = document.getElementById('cashflowBarOut');

    if (homeIn) homeIn.textContent = `+ Rp ${formatIDR(totalIn)}`;
    if (homeOut) homeOut.textContent = `- Rp ${formatIDR(totalOut)}`;
    if (homeNet) {
      homeNet.textContent = `${net >= 0 ? '+' : '-'} Rp ${formatIDR(Math.abs(net))}`;
      homeNet.className = net >= 0 ? 'font-weight-bold text-success mb-0' : 'font-weight-bold text-danger mb-0';
    }
    if (homeBadge) {
      if (net >= 0) {
        homeBadge.className = 'badge badge-success px-2 py-1 font-weight-bold';
        homeBadge.innerHTML = '<i class="bi bi-arrow-up-right mr-1"></i>Surplus';
      } else {
        homeBadge.className = 'badge badge-danger px-2 py-1 font-weight-bold';
        homeBadge.innerHTML = '<i class="bi bi-arrow-down-right mr-1"></i>Defisit';
      }
    }
    if (homeBarIn) homeBarIn.style.width = `${inPercent}%`;
    if (homeBarOut) homeBarOut.style.width = `${outPercent}%`;

    // Home Mini Donut
    const homeDonutIn = document.getElementById('cfHomeDonutIn');
    const homeDonutOut = document.getElementById('cfHomeDonutOut');
    const homeDonutCenterVal = document.getElementById('cfHomeDonutCenterVal');

    if (homeDonutIn) homeDonutIn.setAttribute('stroke-dasharray', `${inDash} ${C - inDash}`);
    if (homeDonutOut) {
      homeDonutOut.setAttribute('stroke-dasharray', `${outDash} ${C - outDash}`);
      homeDonutOut.setAttribute('stroke-dashoffset', `-${inDash}`);
    }
    if (homeDonutCenterVal) {
      homeDonutCenterVal.textContent = totalFlow === 0 ? '0%' : `${net >= 0 ? '+' : ''}${inPercent}%`;
      homeDonutCenterVal.className = `m-cf-donut-center-val ${net >= 0 ? 'text-success' : 'text-danger'}`;
    }

    // 2. Detailed Cashflow elements on Mutasi subpage
    const detIn = document.getElementById('cashflowDetailIn');
    const detOut = document.getElementById('cashflowDetailOut');
    const detNet = document.getElementById('cashflowDetailNet');
    const detStatus = document.getElementById('cashflowDetailStatus');

    if (detIn) detIn.textContent = `+ Rp ${formatIDR(totalIn)}`;
    if (detOut) detOut.textContent = `- Rp ${formatIDR(totalOut)}`;
    if (detNet) {
      detNet.textContent = `${net >= 0 ? '+' : '-'} Rp ${formatIDR(Math.abs(net))}`;
      detNet.className = net >= 0 ? 'font-weight-bold h5 text-success mb-0' : 'font-weight-bold h5 text-danger mb-0';
    }
    if (detStatus) {
      detStatus.textContent = net >= 0 ? 'Arus Kas Sehat (Surplus)' : 'Defisit Arus Kas';
      detStatus.className = net >= 0 ? 'badge badge-success px-2 py-1 font-weight-bold' : 'badge badge-danger px-2 py-1 font-weight-bold';
    }

    // Mutasi Page Full Donut Chart
    const cfDonutIn = document.getElementById('cfDonutIn');
    const cfDonutOut = document.getElementById('cfDonutOut');
    const cfDonutCenterVal = document.getElementById('cfDonutCenterVal');

    if (cfDonutIn) cfDonutIn.setAttribute('stroke-dasharray', `${inDash} ${C - inDash}`);
    if (cfDonutOut) {
      cfDonutOut.setAttribute('stroke-dasharray', `${outDash} ${C - outDash}`);
      cfDonutOut.setAttribute('stroke-dashoffset', `-${inDash}`);
    }
    if (cfDonutCenterVal) {
      cfDonutCenterVal.textContent = totalFlow === 0 ? '0%' : `${inPercent}%`;
      cfDonutCenterVal.className = `m-cf-donut-center-val ${net >= 0 ? 'text-success' : 'text-danger'}`;
    }

    // 3. Swipable Cards Deck (Geser Kartu)
    const cfSlideInVal = document.getElementById('cfSlideInVal');
    const cfSlideInSub = document.getElementById('cfSlideInSub');
    const cfSlideOutVal = document.getElementById('cfSlideOutVal');
    const cfSlideOutSub = document.getElementById('cfSlideOutSub');
    const cfSlideNetVal = document.getElementById('cfSlideNetVal');
    const cfSlideNetSub = document.getElementById('cfSlideNetSub');

    if (cfSlideInVal) cfSlideInVal.textContent = `+ Rp ${formatIDR(totalIn)}`;
    if (cfSlideInSub) cfSlideInSub.textContent = `Porsi ${inPercent}% dari total sirkulasi kas ${state.activePeriod}`;
    if (cfSlideOutVal) cfSlideOutVal.textContent = `- Rp ${formatIDR(totalOut)}`;
    if (cfSlideOutSub) cfSlideOutSub.textContent = `Porsi ${outPercent}% dari total sirkulasi kas ${state.activePeriod}`;
    if (cfSlideNetVal) {
      cfSlideNetVal.textContent = `${net >= 0 ? '+' : '-'} Rp ${formatIDR(Math.abs(net))}`;
      cfSlideNetVal.className = `m-cf-slide-amount ${net >= 0 ? 'text-primary' : 'text-danger'}`;
    }
    if (cfSlideNetSub) {
      cfSlideNetSub.textContent = net >= 0 
        ? 'Arus kas surplus, siap dialokasikan ke Deposito atau Reksadana Welma'
        : 'Arus kas defisit, optimalkan pengeluaran & manfaatkan voucher hemat';
    }

    setupCashflowSwipeDots();
  }

  // --- Horizontal Swipe Dots Indicator Synchronization ---
  function setupCashflowSwipeDots() {
    const deck = document.getElementById('cashflowSwipeDeck');
    const dots = document.querySelectorAll('#cfSwipeDots .m-cf-dot');
    if (!deck || !dots.length) return;

    if (!deck.dataset.swipeListenerAttached) {
      deck.dataset.swipeListenerAttached = 'true';
      deck.addEventListener('scroll', () => {
        const scrollLeft = deck.scrollLeft;
        const slideWidth = deck.offsetWidth * 0.84;
        const activeIdx = Math.min(dots.length - 1, Math.max(0, Math.round(scrollLeft / slideWidth)));
        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === activeIdx);
        });
      }, { passive: true });

      dots.forEach((dot, idx) => {
        dot.style.cursor = 'pointer';
        dot.addEventListener('click', () => {
          const slideWidth = deck.offsetWidth * 0.84;
          deck.scrollTo({ left: idx * slideWidth, behavior: 'smooth' });
        });
      });
    }
  }

  // ==========================================================================
  // Milestone 4: 3 AI Engines Real-Time UI
  // ==========================================================================

  // --- Algoritma 3: Gamification Health Score ---
  function renderGamificationCard() {
    const gamification = state.aiStatus?.gamification;
    if (!gamification) return;

    const tierLower = (gamification.tier || 'bronze').toLowerCase();

    // 1. Dynamic Card Border & Metallic Glow
    const cardEl = document.getElementById('healthScoreCard');
    if (cardEl) {
      cardEl.className = `adapt-card health-card-tier tier-${tierLower}`;
    }

    // 2. Dynamic Plakat (Circular Plaque) Theme
    const plaqueEl = document.getElementById('healthScorePlaque');
    if (plaqueEl) {
      plaqueEl.className = `score-plaque-circle plaque-${tierLower}`;
    }

    const plaqueIcon = document.getElementById('plaqueIcon');
    if (plaqueIcon) {
      if (tierLower === 'diamond') {
        plaqueIcon.className = 'bi bi-gem';
      } else if (tierLower === 'gold') {
        plaqueIcon.className = 'bi bi-trophy-fill';
      } else if (tierLower === 'silver') {
        plaqueIcon.className = 'bi bi-award-fill';
      } else {
        plaqueIcon.className = 'bi bi-shield-fill-check';
      }
    }

    const plaqueRibbon = document.getElementById('plaqueTierRibbon');
    if (plaqueRibbon) {
      plaqueRibbon.textContent = (gamification.tier || 'Bronze').toUpperCase();
    }

    // 3. Score Number & Progress
    const scoreNumEl = document.getElementById('scoreNum');
    if (scoreNumEl) scoreNumEl.textContent = gamification.score;

    const fillEl = document.getElementById('scoreProgressFill');
    if (fillEl) fillEl.style.width = `${Math.min(100, Math.max(0, gamification.score))}%`;

    const tierBadge = document.getElementById('tierBadge');
    if (tierBadge) {
      const badgeClass = `badge-${tierLower}`;
      tierBadge.className = `tier-badge ${badgeClass}`;
      tierBadge.innerHTML = `<i class="bi bi-award-fill"></i> Level ${gamification.tier}`;
    }

    const rewardEl = document.getElementById('rewardPoints');
    if (rewardEl) {
      rewardEl.textContent = `${(gamification.reward_points || 0).toLocaleString('id-ID')} Poin BCA`;
    }

    const breakdownContainer = document.getElementById('scoreBreakdown');
    if (breakdownContainer && gamification.breakdown) {
      const b = gamification.breakdown;
      let items = `
        <div class="d-flex justify-content-between">
          <span>Base Platform Health</span>
          <strong class="text-success">+${b.base_score || 20} PTS</strong>
        </div>
      `;

      if (b.active_features && b.active_features.length > 0) {
        b.active_features.forEach(af => {
          items += `
            <div class="d-flex justify-content-between">
              <span>Fitur: ${af.name}</span>
              <strong class="text-success">+${af.points} PTS</strong>
            </div>
          `;
        });
      }

      if (b.timeliness_bonus > 0) {
        items += `
          <div class="d-flex justify-content-between">
            <span>Ketepatan Bayar Tagihan (Rate: ${state.user?.timeliness_rate || 95}%)</span>
            <strong class="text-warning">+${b.timeliness_bonus} PTS</strong>
          </div>
        `;
      }

      if (b.savings_bonus > 0) {
        items += `
          <div class="d-flex justify-content-between">
            <span>Konsistensi Tabungan Bulanan</span>
            <strong class="text-info">+${b.savings_bonus} PTS</strong>
          </div>
        `;
      }

      breakdownContainer.innerHTML = items;
    }
  }

  // --- Algoritma 1: Contextual Feature Recommendations ---
  function renderRecommendationsFeed() {
    const container = document.getElementById('recommendationsList');
    if (!container) return;

    const recs = state.aiStatus?.propensity || state.aiStatus?.propensity_recommendations || [];

    if (recs.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 bg-light rounded border">
          <i class="bi bi-check-circle-fill text-success h3 d-block mb-1"></i>
          <strong class="text-dark">Semua Rekomendasi Utama Telah Aktif!</strong>
          <div class="small text-muted">Akun Anda telah mengoptimalkan seluruh ekosistem fitur myBCA ADAPT.</div>
        </div>
      `;
      return;
    }

    let html = '';
    recs.slice(0, 3).forEach(item => {
      const feat = item.feature || item;
      const featId = feat.id || item.feature_id;
      const featName = feat.name || item.name;
      const points = feat.points || 15;
      const icon = feat.icon || 'bi-stars';
      const desc = feat.description || feat.desc || 'Fitur perbankan terpersonalisasi myBCA.';
      const score = Math.round(item.score || 70);

      html += `
        <div class="rec-item-card">
          <div class="rec-feature-icon">
            <i class="bi ${icon}"></i>
          </div>
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong class="text-dark small" style="font-size: 0.83rem;">${featName}</strong>
              <span class="badge badge-light border text-primary font-weight-bold" style="font-size: 0.7rem; background: #e0f2fe; color: #0284c7; border-color: #bae6fd !important;">
                <i class="bi bi-stars text-warning mr-1"></i>${score}% Relevan
              </span>
            </div>
            <div class="small text-muted mb-2" style="font-size: 0.75rem; line-height: 1.35;">${desc}</div>
            <div class="d-flex justify-content-between align-items-center pt-1 border-top" style="border-color: #f1f5f9 !important;">
              <span class="small text-success font-weight-bold" style="font-size: 0.72rem;">
                <i class="bi bi-plus-circle-fill mr-1"></i>+${points} Poin Kesehatan
              </span>
              <button type="button" class="btn-activate-rec" onclick="app.activateFeature('${featId}', '${featName}')">
                <i class="bi bi-arrow-right-short mr-1 font-weight-bold"></i> Buka Fitur
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // --- Algoritma 2: Life Event Detection & Smart Bundling ---
  function renderLifeEventBanner() {
    const container = document.getElementById('lifeEventContainer');
    if (!container) return;

    const lifeEvent = state.aiStatus?.life_event;

    if (!lifeEvent || !lifeEvent.detected || lifeEvent.confidence < 60) {
      container.innerHTML = `
        <div class="m-monitoring-card mb-3">
          <div class="d-flex align-items-center gap-2">
            <div class="m-monitoring-icon">
              <i class="bi bi-radar"></i>
            </div>
            <div class="flex-grow-1">
              <div class="font-weight-bold text-dark small" style="font-size: 0.78rem;">Pemantauan Pola Hidup Cerdas (AI)</div>
              <div class="text-muted" style="font-size: 0.68rem; line-height: 1.3;">Mendeteksi perubahan pola keuangan & siap menyarankan paket terintegrasi.</div>
            </div>
            <span class="badge badge-light border text-muted small" style="font-size: 0.65rem;">
              <i class="bi bi-activity text-success mr-1"></i>Aktif
            </span>
          </div>
        </div>
      `;
      state.activeBundle = null;
      return;
    }

    state.activeBundle = lifeEvent;
    const ruleId = lifeEvent.rule_id || lifeEvent.event_type;
    const bundleName = lifeEvent.bundle_name || 'Paket Momen Hidup Baru';
    const confidence = Math.round(lifeEvent.confidence || 75);
    const bonusPts = lifeEvent.bonus_points || 25;
    const desc = lifeEvent.description || 'Terdeteksi pergeseran pola finansial signifikan pada akun Anda.';
    const signals = lifeEvent.detected_signals || [];

    const signalBadges = signals.map(s => `<span class="badge badge-light border mr-1 mb-1 font-weight-normal" style="font-size: 0.68rem; background: rgba(255,255,255,0.14); color: #ffffff; border-color: rgba(255,255,255,0.2) !important;"><i class="bi bi-check-circle-fill text-warning mr-1"></i>${s}</span>`).join('');

    container.innerHTML = `
      <div class="life-event-banner-box">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="badge badge-warning text-dark font-weight-bold" style="font-size: 0.68rem; border-radius: 6px;">
            <i class="bi bi-stars mr-1"></i> Smart Bundle Terdeteksi (${confidence}% Match)
          </span>
          <button type="button" class="btn btn-outline-light btn-sm font-weight-bold py-0 px-2" style="font-size: 0.7rem; border-radius: 6px;" onclick="app.openBundleModal()">
            <i class="bi bi-info-circle mr-1"></i> Rincian
          </button>
        </div>

        <h5 class="font-weight-bold text-white mb-1" style="font-size: 0.95rem; line-height: 1.3;">
          <i class="bi bi-gift-fill text-warning mr-1"></i> ${bundleName}
        </h5>
        <p class="text-white-50 small mb-2" style="font-size: 0.72rem; line-height: 1.35;">${desc}</p>

        <div class="mb-2">
          <div class="small text-white-50 mb-1" style="font-size: 0.68rem;">Sinyal Transaksi Terverifikasi:</div>
          <div class="d-flex flex-wrap">${signalBadges}</div>
        </div>

        <div class="pt-2 border-top" style="border-color: rgba(255,255,255,0.15) !important;">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="small text-warning font-weight-bold" style="font-size: 0.72rem;">
              🎁 Reward: +${bonusPts} Poin Kesehatan Finansial
            </span>
          </div>
          <button type="button" class="btn-claim-bundle-lg" onclick="app.claimBundle('${ruleId}', '${bundleName}')">
            <i class="bi bi-lightning-charge-fill mr-1"></i> Aktifkan Paket Bundle Sekaligus (+${bonusPts} PTS Bonus)
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // Milestone 5: Simulation Lab & Audit Engine Inspector
  // ==========================================================================

  function renderScenarioButtons() {
    const container = document.getElementById('scenariosContainer');
    if (!container) return;

    const scenarios = state.scenarios.length > 0 ? state.scenarios : [
      { id: 'scen_freshgrad', name: 'Fresh Graduate (Dimas)', persona_id: 'dimas' },
      { id: 'scen_newlywed', name: 'Rumah Tangga Baru (Ayu)', persona_id: 'ayu' },
      { id: 'scen_merchant', name: 'Pro Merchant (Sari)', persona_id: 'sari' }
    ];

    let html = '';
    scenarios.forEach(scen => {
      html += `
        <button type="button" class="btn btn-outline-primary btn-sm font-weight-bold" onclick="app.triggerScenario('${scen.id}')">
          <i class="bi bi-play-circle-fill mr-1"></i> ${scen.name}
        </button>
      `;
    });

    container.innerHTML = html;
  }

  function renderAuditLogs() {
    const container = document.getElementById('logStream');
    if (!container) return;

    const logs = state.auditLogs || [];
    if (logs.length === 0) {
      container.innerHTML = '<div class="text-muted small">Belum ada decision trace log.</div>';
      return;
    }

    let html = '';
    logs.forEach(l => {
      const timeStr = l.timestamp ? l.timestamp.slice(11, 19) : new Date().toTimeString().slice(0, 8);
      html += `
        <div class="log-item-row">
          <span class="text-secondary">[${timeStr}]</span>
          <span class="text-warning font-weight-bold">[${l.engine || 'SYSTEM'}]</span>
          <span class="text-light">${l.message}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // --- Feature Onboarding & Registration Actions (Milestone Enhancement) ---
  let activeOnboardingState = null;

  async function openFeatureOnboarding(featureId, featureName) {
    const modalEl = document.getElementById('featureOnboardingModal');
    if (!modalEl) {
      return activateFeatureDirect(featureId, featureName);
    }

    const titleEl = document.getElementById('onboardingModalTitle');
    const subtitleEl = document.getElementById('onboardingModalSubtitle');
    const iconEl = document.getElementById('onboardingHeaderIcon');
    const bodyEl = document.getElementById('onboardingModalBody');
    const footerEl = document.getElementById('onboardingModalFooter');

    // Show loading state
    bodyEl.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <div class="text-muted small">Memuat katalog & spesifikasi produk ${featureName}...</div>
      </div>
    `;
    modalEl.style.display = 'block';
    modalEl.classList.add('show');

    try {
      const res = await apiFetch(`/api/features/${featureId}/onboarding`);
      const data = res.data;

      const feature = data.feature;
      const onboarding = data.onboarding;
      const account = data.source_account || state.account;

      const defaultProd = (onboarding.products && onboarding.products.length > 0) ? onboarding.products[0] : null;
      const defaultAmount = onboarding.default_amount !== undefined ? onboarding.default_amount : (defaultProd?.min_amount || 0);

      activeOnboardingState = {
        featureId,
        featureName: feature.name || featureName,
        points: feature.points || 15,
        icon: feature.icon || 'bi-stars',
        onboarding,
        cashflow: data.cashflow_analysis || null,
        account,
        selectedProduct: defaultProd,
        initialAmount: defaultAmount
      };

      if (titleEl) titleEl.textContent = onboarding.category_title || `Pendaftaran ${feature.name}`;
      if (subtitleEl) subtitleEl.textContent = onboarding.subtitle || 'Konfirmasi dan tentukan alokasi dana layanan Anda';
      if (iconEl) iconEl.className = `bi ${feature.icon || 'bi-graph-up'} h5 mb-0`;

      renderOnboardingStep1();

    } catch (err) {
      console.error('Error fetching feature onboarding:', err);
      bodyEl.innerHTML = `
        <div class="alert alert-danger mb-0">
          Gagal memuat informasi pendaftaran: ${err.message}.
          <div class="mt-3">
            <button class="btn btn-sm btn-outline-secondary" onclick="app.closeOnboardingModal()">Tutup</button>
          </div>
        </div>
      `;
    }
  }

  function renderOnboardingStep1() {
    if (!activeOnboardingState) return;
    const bodyEl = document.getElementById('onboardingModalBody');
    const footerEl = document.getElementById('onboardingModalFooter');
    if (!bodyEl) return;

    const { featureId, featureName, points, icon, onboarding, cashflow, account, selectedProduct, initialAmount } = activeOnboardingState;
    const products = onboarding.products || [];
    const presets = onboarding.amount_presets || [];
    const requiresBalance = !!onboarding.requires_initial_balance;
    const currentBalance = account?.balance || 0;
    const remainingBalance = currentBalance - initialAmount;
    const isInsufficient = requiresBalance && (remainingBalance < 0);
    const isTightCashflow = cashflow && cashflow.recommendations?.max_safe_limit && (initialAmount > cashflow.recommendations.max_safe_limit);

    let productsHtml = '';
    products.forEach((p) => {
      const isSelected = selectedProduct && selectedProduct.id === p.id;
      const minText = p.min_amount > 0 ? `Min. ${formatCurrency(p.min_amount)}` : 'Bebas Min.';
      productsHtml += `
        <div class="onboarding-product-card ${isSelected ? 'active-product' : ''}" onclick="app.selectOnboardingProduct('${p.id}')">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <div class="d-flex align-items-center gap-2">
              <div class="product-select-indicator mr-2">
                ${isSelected ? '<i class="bi bi-check" style="font-size: 0.9rem;"></i>' : ''}
              </div>
              <div>
                <strong class="text-dark d-block" style="font-size: 0.95rem;">${p.name}</strong>
                <span class="text-muted small">${p.manager || p.type}</span>
              </div>
            </div>
            <span class="badge ${p.risk_badge || 'badge-primary'} font-weight-bold" style="font-size: 0.75rem;">
              ${p.est_return || p.risk_level}
            </span>
          </div>
          <div class="small text-secondary pl-4 ml-3 mb-2" style="font-size: 0.8rem; line-height: 1.4;">
            ${p.description}
          </div>
          <div class="d-flex justify-content-between align-items-center pl-4 ml-3 pt-1 border-top small text-muted" style="font-size: 0.75rem; border-color: #f1f5f9 !important;">
            <span><i class="bi bi-shield-check mr-1 text-primary"></i>${p.risk_level}</span>
            <span class="font-weight-bold text-primary">${minText}</span>
          </div>
        </div>
      `;
    });

    // Panel Khusus Anti-Meleset untuk Auto-Save
    let cashflowBoxHtml = '';
    if (featureId === 'auto_save' && cashflow) {
      const breakdownText = (cashflow.expense_breakdown || [])
        .slice(0, 3)
        .map(b => `${b.category} (${b.percentage}%)`)
        .join(' &bull; ');

      cashflowBoxHtml = `
        <div class="p-3 rounded mb-3" style="background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%); border: 1.5px solid #86efac;">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <strong class="text-dark small d-flex align-items-center gap-1">
              <i class="bi bi-calculator-fill text-success mr-1"></i> AI Cashflow & Auto-Save Calculator (Anti-Meleset Engine)
            </strong>
            <span class="badge badge-success font-weight-bold" style="font-size: 0.7rem;">
              <i class="bi bi-shield-check mr-1"></i> Cashflow Guard Active
            </span>
          </div>

          <div class="row text-center mb-2">
            <div class="col-4 border-right">
              <span class="text-muted d-block" style="font-size: 0.7rem;">Rata-rata Pengeluaran</span>
              <strong class="text-danger small">${formatCurrency(cashflow.average_monthly_expense)}/bln</strong>
            </div>
            <div class="col-4 border-right">
              <span class="text-muted d-block" style="font-size: 0.7rem;">Pemasukan Bulanan</span>
              <strong class="text-primary small">${formatCurrency(cashflow.average_monthly_income)}/bln</strong>
            </div>
            <div class="col-4">
              <span class="text-muted d-block" style="font-size: 0.7rem;">Surplus Kas Bersih</span>
              <strong class="text-success small">${formatCurrency(cashflow.net_surplus)}/bln</strong>
            </div>
          </div>

          <div class="mb-2">
            <div class="d-flex justify-content-between text-muted" style="font-size: 0.7rem;">
              <span>Pos Pengeluaran Utama:</span>
              <span>${breakdownText}</span>
            </div>
          </div>

          <!-- Mode Nabung Cerdas Presets -->
          <div class="mt-2 pt-2 border-top" style="border-color: rgba(0,0,0,0.08) !important;">
            <span class="small font-weight-bold text-dark d-block mb-1">Pilih Mode Menabung Terukur:</span>
            <div class="d-flex flex-wrap gap-2 mb-2" style="gap: 0.4rem;">
              <button type="button" class="preset-chip-btn ${initialAmount === cashflow.recommendations.conservative ? 'active-preset' : ''}" onclick="app.setOnboardingAmount(${cashflow.recommendations.conservative})">
                Konservatif (10%): ${formatCurrency(cashflow.recommendations.conservative)}
              </button>
              <button type="button" class="preset-chip-btn ${initialAmount === cashflow.recommendations.optimal ? 'active-preset' : ''}" onclick="app.setOnboardingAmount(${cashflow.recommendations.optimal})">
                ⭐ Rekomendasi Optimal (15%): ${formatCurrency(cashflow.recommendations.optimal)}
              </button>
              <button type="button" class="preset-chip-btn ${initialAmount === cashflow.recommendations.aggressive ? 'active-preset' : ''}" onclick="app.setOnboardingAmount(${cashflow.recommendations.aggressive})">
                Agresif (25%): ${formatCurrency(cashflow.recommendations.aggressive)}
              </button>
            </div>
          </div>

          <!-- Anti-Meleset Status Info -->
          ${isTightCashflow ? `
            <div class="alert alert-warning py-1 px-2 small mb-0 mt-2 d-flex align-items-center gap-2" style="font-size: 0.75rem;">
              <i class="bi bi-exclamation-triangle-fill text-warning"></i>
              <div><strong>Peringatan Risiko Meleset:</strong> Nominal tabungan Rp ${formatCurrency(initialAmount)} berisiko mengganggu sisa kas operasional bulanan Anda (Rata-rata pengeluaran: ${formatCurrency(cashflow.average_monthly_expense)}). Disarankan maksimal Rp ${formatCurrency(cashflow.recommendations.max_safe_limit)}/bln.</div>
            </div>
          ` : `
            <div class="alert alert-success py-1 px-2 small mb-0 mt-2 d-flex align-items-center gap-2" style="font-size: 0.75rem;">
              <i class="bi bi-check-circle-fill text-success"></i>
              <div><strong>Arus Kas Terjaga 100%:</strong> Dana operasional bulanan Anda tetap surplus dan aman untuk menutup seluruh pengeluaran bulanan (${formatCurrency(cashflow.average_monthly_expense)}). Target dana darurat tercapai dalam ~${cashflow.emergency_fund.months_to_target} bulan.</div>
            </div>
          `}
        </div>
      `;
    }

    let balanceSectionHtml = '';
    if (requiresBalance) {
      let presetChipsHtml = presets.map(amt => `
        <button type="button" class="preset-chip-btn ${initialAmount === amt ? 'active-preset' : ''}" onclick="app.setOnboardingAmount(${amt})">
          ${formatCurrency(amt)}
        </button>
      `).join('');

      balanceSectionHtml = `
        <div class="mt-4 pt-3 border-top" style="border-color: #e2e8f0 !important;">
          <h6 class="font-weight-bold text-dark mb-2">
            <i class="bi bi-wallet2 text-primary mr-1"></i> 2. Penetapan Saldo / Alokasi Auto-Save
          </h6>
          <p class="text-muted small mb-3">
            Tentukan nominal saldo yang ingin Anda alokasikan untuk layanan ini. Dana akan didebitkan langsung dari rekening Tahapan BCA Anda.
          </p>

          ${cashflowBoxHtml}

          <!-- Rekening Sumber -->
          <div class="source-account-preview mb-3 d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <div class="bg-primary text-white p-2 rounded-circle mr-2" style="width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
                <i class="bi bi-credit-card"></i>
              </div>
              <div>
                <strong class="d-block small text-dark">Rekening Sumber (Tahapan BCA)</strong>
                <span class="text-muted small">${account?.account_no || '8820491823'} &bull; Sdr. ${state.user?.name || 'Nasabah'}</span>
              </div>
            </div>
            <div class="text-right">
              <span class="small text-muted d-block">Saldo Tersedia:</span>
              <strong class="text-primary">${formatCurrency(currentBalance)}</strong>
            </div>
          </div>

          <!-- Quick Presets -->
          <div class="mb-2">
            <span class="small font-weight-bold text-secondary d-block mb-1">Pilihan Nominal Cepat:</span>
            <div class="d-flex flex-wrap gap-2 mb-2" style="gap: 0.5rem;">
              ${presetChipsHtml}
            </div>
          </div>

          <!-- Input Manual Saldo -->
          <div class="form-group mb-3">
            <label class="small font-weight-bold text-dark mb-1" for="inputInitialAmount">Nominal Alokasi Saldo (Rp):</label>
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text font-weight-bold bg-light">Rp</span>
              </div>
              <input 
                type="number" 
                id="inputInitialAmount" 
                class="form-control font-weight-bold ${isInsufficient ? 'is-invalid' : ''}" 
                value="${initialAmount}" 
                min="${selectedProduct?.min_amount || 0}" 
                step="10000"
                oninput="app.handleManualAmountInput(this.value)"
              >
            </div>
            ${isInsufficient ? `
              <div class="text-danger small font-weight-bold mt-1">
                <i class="bi bi-exclamation-triangle-fill mr-1"></i> Saldo rekening Tahapan BCA tidak mencukupi! Kurangi nominal saldo alokasi.
              </div>
            ` : `
              <div class="small text-muted mt-1 d-flex justify-content-between">
                <span>Minimal penempatan: <strong>${formatCurrency(selectedProduct?.min_amount || 0)}</strong></span>
                <span>Sisa saldo setelah penempatan: <strong class="text-success">${formatCurrency(remainingBalance)}</strong></span>
              </div>
            `}
          </div>
        </div>
      `;
    }

    bodyEl.innerHTML = `
      <!-- Banner Fitur -->
      <div class="p-3 rounded mb-3 d-flex justify-content-between align-items-center" style="background: #f0f7ff; border: 1px solid #bae6fd;">
        <div class="d-flex align-items-center gap-2">
          <div class="bg-primary text-white p-2 rounded-circle mr-2" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <i class="bi ${icon} h6 mb-0"></i>
          </div>
          <div>
            <strong class="text-dark d-block">${featureName}</strong>
            <span class="small text-muted">${onboarding.subtitle || 'Solusi Finansial myBCA ADAPT'}</span>
          </div>
        </div>
        <span class="badge badge-success px-2 py-1 font-weight-bold" style="font-size: 0.8rem;">
          <i class="bi bi-award-fill mr-1"></i> +${points} Poin Kesehatan
        </span>
      </div>

      <!-- 1. Daftar Produk / Pilihan Layanan -->
      <div class="mb-3">
        <h6 class="font-weight-bold text-dark mb-2">
          <i class="bi bi-collection-fill text-primary mr-1"></i> 1. Pilih Produk / Instrumen
        </h6>
        <div class="products-list-container">
          ${productsHtml}
        </div>
      </div>

      <!-- 2. Saldo Alokasi (Jika ada) -->
      ${balanceSectionHtml}

      <!-- Syarat & Ketentuan -->
      <div class="mt-3 p-2 bg-light rounded border small text-muted">
        <div class="form-check">
          <input type="checkbox" class="form-check-input" id="checkTermsAgreement" checked>
          <label class="form-check-label text-dark" for="checkTermsAgreement" style="font-size: 0.775rem;">
            Saya telah membaca prospektus produk, memahami tingkat profil risiko investasi, dan menyetujui syarat serta ketentuan pembukaan rekening layanan di myBCA.
          </label>
        </div>
      </div>
    `;

    footerEl.innerHTML = `
      <button type="button" class="btn btn-outline-secondary btn-sm font-weight-bold" onclick="app.closeOnboardingModal()">Batal</button>
      <button type="button" class="btn btn-bca-primary btn-sm font-weight-bold" id="btnSubmitOnboarding" ${isInsufficient ? 'disabled' : ''} onclick="app.confirmFeatureOnboarding()">
        <i class="bi bi-check2-circle mr-1"></i> Konfirmasi & Buka Layanan
      </button>
    `;
  }

  function selectOnboardingProduct(productId) {
    if (!activeOnboardingState) return;
    const prod = activeOnboardingState.onboarding.products?.find(p => p.id === productId);
    if (prod) {
      activeOnboardingState.selectedProduct = prod;
      if (activeOnboardingState.initialAmount < prod.min_amount) {
        activeOnboardingState.initialAmount = prod.min_amount;
      }
      renderOnboardingStep1();
    }
  }

  function setOnboardingAmount(amount) {
    if (!activeOnboardingState) return;
    activeOnboardingState.initialAmount = parseInt(amount, 10) || 0;
    renderOnboardingStep1();
  }

  function handleManualAmountInput(val) {
    if (!activeOnboardingState) return;
    const num = parseInt(val, 10);
    activeOnboardingState.initialAmount = isNaN(num) ? 0 : num;
    const currentBalance = activeOnboardingState.account?.balance || 0;
    const isInsufficient = activeOnboardingState.initialAmount > currentBalance;

    const submitBtn = document.getElementById('btnSubmitOnboarding');
    if (submitBtn) {
      submitBtn.disabled = isInsufficient;
    }
  }

  async function confirmFeatureOnboarding() {
    if (!activeOnboardingState) return;

    const termsCheckbox = document.getElementById('checkTermsAgreement');
    if (termsCheckbox && !termsCheckbox.checked) {
      showToast('Harap centang persetujuan syarat & ketentuan terlebih dahulu.', 'warning');
      return;
    }

    const { featureId, featureName, selectedProduct, initialAmount } = activeOnboardingState;
    const submitBtn = document.getElementById('btnSubmitOnboarding');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm mr-1"></span> Memproses Pembukaan...';
    }

    try {
      const res = await apiFetch(`/api/features/${featureId}/activate`, {
        method: 'POST',
        body: JSON.stringify({
          initial_amount: initialAmount,
          product_id: selectedProduct?.id || null,
          product_name: selectedProduct?.name || featureName
        })
      });

      const receipt = res.receipt || res.data?.receipt;
      const pts = res.points_awarded || res.data?.points_awarded || 20;

      showToast(`🎉 Pembukaan "${selectedProduct?.name || featureName}" Berhasil! (+${pts} Poin)`);

      // Tampilkan struk bukti transaksi resmi myBCA
      renderOnboardingReceipt(receipt, res);

      // Refresh seluruh data dashboard di background
      await loadDashboardData();
      await fetchAuditLogs();
      renderAll();

    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check2-circle mr-1"></i> Konfirmasi & Buka Layanan';
      }
      if (err.status === 409) {
        showToast(`Fitur "${featureName}" sudah aktif pada akun Anda.`, 'warning');
        closeOnboardingModal();
      } else {
        showToast(`Gagal memproses pendaftaran: ${err.message}`, 'error');
      }
    }
  }

  function renderOnboardingReceipt(receipt) {
    const bodyEl = document.getElementById('onboardingModalBody');
    const footerEl = document.getElementById('onboardingModalFooter');
    const titleEl = document.getElementById('onboardingModalTitle');
    const subtitleEl = document.getElementById('onboardingModalSubtitle');

    if (titleEl) titleEl.textContent = 'Bukti Transaksi Pendaftaran';
    if (subtitleEl) subtitleEl.textContent = 'myBCA e-Receipt Resmi';

    const refNo = receipt?.reference_no || ('REF-BCA' + Date.now().toString().slice(-8));
    const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const prodName = receipt?.product_name || activeOnboardingState?.selectedProduct?.name || activeOnboardingState?.featureName;
    const accNo = receipt?.account_no || state.account?.account_no || '8820491823';
    const amount = receipt?.amount !== undefined ? receipt.amount : (activeOnboardingState?.initialAmount || 0);
    const newBal = receipt?.new_balance !== undefined ? receipt.new_balance : state.account?.balance;
    const pts = receipt?.points_awarded || activeOnboardingState?.points || 20;

    bodyEl.innerHTML = `
      <div class="bca-receipt-card">
        <div class="bca-receipt-header">
          <div class="text-success mb-2">
            <i class="bi bi-check-circle-fill" style="font-size: 3.5rem;"></i>
          </div>
          <h5 class="font-weight-bold text-dark mb-1">TRANSAKSI BERHASIL</h5>
          <span class="badge badge-success px-3 py-1 font-weight-bold mb-2">Layanan Resmi Aktif</span>
          <div class="text-muted small">Terima kasih telah melakukan pembukaan layanan di myBCA ADAPT.</div>
        </div>

        <div class="py-3">
          <div class="bca-receipt-row">
            <span class="bca-receipt-label">No. Referensi:</span>
            <span class="bca-receipt-value font-monospace">${refNo}</span>
          </div>
          <div class="bca-receipt-row">
            <span class="bca-receipt-label">Waktu Transaksi:</span>
            <span class="bca-receipt-value">${nowStr}</span>
          </div>
          <div class="bca-receipt-row">
            <span class="bca-receipt-label">Nama Produk / Fitur:</span>
            <span class="bca-receipt-value text-primary">${prodName}</span>
          </div>
          <div class="bca-receipt-row">
            <span class="bca-receipt-label">Rekening Sumber:</span>
            <span class="bca-receipt-value">Tahapan BCA - ${accNo}</span>
          </div>
          ${amount > 0 ? `
            <div class="bca-receipt-row">
              <span class="bca-receipt-label">Nominal Alokasi Saldo:</span>
              <span class="bca-receipt-value text-danger font-weight-bold">- ${formatCurrency(amount)}</span>
            </div>
            <div class="bca-receipt-row">
              <span class="bca-receipt-label">Sisa Saldo Rekening:</span>
              <span class="bca-receipt-value text-success">${formatCurrency(newBal)}</span>
            </div>
          ` : `
            <div class="bca-receipt-row">
              <span class="bca-receipt-label">Biaya Pendaftaran:</span>
              <span class="bca-receipt-value text-success font-weight-bold">GRATIS (Rp 0)</span>
            </div>
          `}
          <div class="bca-receipt-row border-top mt-2 pt-2">
            <span class="bca-receipt-label">Reward Gamifikasi:</span>
            <span class="bca-receipt-value text-warning font-weight-bold">
              <i class="bi bi-star-fill mr-1"></i> +${pts} Poin Kesehatan Finansial
            </span>
          </div>
        </div>

        <div class="p-2 bg-light rounded text-center small text-muted" style="font-size: 0.75rem;">
          <i class="bi bi-shield-lock-fill text-primary mr-1"></i> Transaksi ini sah dan diproses secara real-time oleh Core Banking BCA.
        </div>
      </div>
    `;

    footerEl.innerHTML = `
      <button type="button" class="btn btn-outline-secondary btn-sm" onclick="window.print()">
        <i class="bi bi-printer mr-1"></i> Cetak Struk
      </button>
      <button type="button" class="btn btn-bca-primary btn-sm font-weight-bold" onclick="app.closeOnboardingModal()">
        <i class="bi bi-arrow-left mr-1"></i> Selesai & Kembali ke Dashboard
      </button>
    `;
  }

  function closeOnboardingModal() {
    const modalEl = document.getElementById('featureOnboardingModal');
    if (modalEl) {
      modalEl.style.display = 'none';
      modalEl.classList.remove('show');
    }
    activeOnboardingState = null;
  }

  // Fallback direct activation
  async function activateFeatureDirect(featureId, featureName) {
    try {
      const res = await apiFetch(`/api/features/${featureId}/activate`, {
        method: 'POST'
      });
      const pts = res.points_awarded || res.data?.points_awarded || 15;
      showToast(`🎉 Fitur "${featureName}" berhasil diaktifkan! (+${pts} Poin)`);
      await fetchAIStatus();
      await fetchAuditLogs();
      renderAll();
    } catch (err) {
      if (err.status === 409) {
        showToast(`Fitur "${featureName}" sudah aktif.`, 'warning');
      } else {
        showToast(`Gagal mengaktifkan fitur: ${err.message}`, 'error');
      }
    }
  }

  async function activateFeature(featureId, featureName) {
    // Arahkan ke modal flow pendaftaran & penetapan saldo
    return openFeatureOnboarding(featureId, featureName);
  }

  async function claimBundle(ruleId, bundleName) {
    try {
      const res = await apiFetch(`/api/bundles/${ruleId}/activate`, {
        method: 'POST'
      });

      const bonusPts = res.bonus_points_awarded || res.data?.bonus_points_awarded || 25;
      const count = res.activated_features?.length || res.data?.activated_features?.length || 2;

      showToast(`🚀 Paket Bundle "${bundleName}" berhasil diklaim! (${count} fitur aktif, +${bonusPts} PTS Bonus)`);

      // Close modal if open
      closeBundleModal();

      // Refresh Dashboard & AI Status
      await loadDashboardData();
    } catch (err) {
      showToast(`Gagal mengklaim bundle: ${err.message}`, 'error');
    }
  }

  async function handleAddTransactionSubmit(e) {
    e.preventDefault();

    const descInput = document.getElementById('txDesc');
    const amountInput = document.getElementById('txAmount');
    const previewBox = document.getElementById('aiCategoryPreview');
    const previewCatName = document.getElementById('previewCatName');
    const previewCatType = document.getElementById('previewCatType');
    const previewReason = document.getElementById('previewReason');

    const description = descInput.value.trim();
    const amount = parseInt(amountInput.value, 10);

    if (!description || isNaN(amount) || amount <= 0) {
      showToast('Nama transaksi dan nominal (> 0) wajib diisi.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('btnSubmitTx');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm mr-1"></span> AI Menganalisis...';

    try {
      const res = await apiFetch('/api/transactions/inject', {
        method: 'POST',
        body: {
          description,
          amount
        }
      });

      const tx = res.transaction || res.data?.transaction || {};
      const catName = tx.category || 'Transaksi';
      const txType = tx.type === 'CR' ? 'Uang Masuk (+)' : 'Uang Keluar (-)';

      // Tampilkan feedback AI hasil klasifikasi
      if (previewBox && previewCatName && previewCatType) {
        previewCatName.textContent = catName;
        previewCatType.textContent = tx.type === 'CR' ? 'CR (Masuk +)' : 'DB (Keluar -)';
        previewCatType.className = tx.type === 'CR' ? 'badge badge-success ml-1' : 'badge badge-danger ml-1';
        if (previewReason) {
          previewReason.textContent = `Klasifikasi otomatis oleh AI Engine`;
        }
        previewBox.classList.remove('d-none');
        previewBox.classList.add('d-flex');
      }

      showToast(`✨ AI mendeteksi: "${catName}" • ${txType} • Transaksi berhasil dicatat!`);

      // Clear input fields
      descInput.value = '';
      amountInput.value = '';

      // Update account balance & reload dashboard state
      await loadDashboardData();
    } catch (err) {
      showToast(`Gagal menyuntikkan transaksi: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-cpu mr-1"></i> Simulasikan Transaksi';
    }
  }

  async function triggerScenario(scenarioId) {
    try {
      showToast('⚡ Menjalankan skenario simulasi...', 'warning');
      const res = await apiFetch(`/api/simulation/scenarios/${scenarioId}/trigger`, {
        method: 'POST'
      });

      const personaId = res.persona_id || res.data?.persona_id;
      const scenName = res.scenario_name || res.data?.scenario_name || scenarioId;

      // Switch session to scenario persona
      if (personaId && (!state.user || state.user.id !== personaId)) {
        await handleQuickLogin(personaId);
      } else {
        await loadDashboardData();
      }

      showToast(`✅ Skenario "${scenName}" selesai dijalankan! Engine merekalibrasi otomatis.`);
    } catch (err) {
      showToast(`Gagal memicu skenario: ${err.message}`, 'error');
    }
  }

  async function handleResetDatabase() {
    if (!confirm('Apakah Anda yakin ingin mereset database ke kondisi seed awal? Seluruh transaksi dan aktivasi fitur demonstrasi akan dikembalikan.')) {
      return;
    }

    try {
      const res = await apiFetch('/api/admin/reset', { method: 'POST' });
      showToast(`🔄 ${res.message || 'Database berhasil di-reset ke kondisi awal seed!'} (${res.duration_ms || 4}ms)`);

      // Refresh current user session and dashboard data
      if (state.token) {
        try {
          const sessRes = await apiFetch('/api/auth/session');
          state.user = sessRes.user || sessRes.data?.user;
          state.account = sessRes.account || sessRes.data?.account;
        } catch {
          // fallback to login if session was wiped
          await handleLogout();
          return;
        }
      }

      await loadDashboardData();
    } catch (err) {
      showToast(`Gagal mereset database: ${err.message}`, 'error');
    }
  }

  // --- Modal Helpers ---
  function openBundleModal() {
    const modal = document.getElementById('smartBundleModal');
    const content = document.getElementById('modalBundleContent');
    const lifeEvent = state.activeBundle;
    if (!modal || !content || !lifeEvent) return;

    const ruleId = lifeEvent.rule_id || lifeEvent.event_type;
    const bundleName = lifeEvent.bundle_name || 'Smart Bundle';
    const bonusPts = lifeEvent.bonus_points || 25;
    const signals = lifeEvent.detected_signals || [];
    const features = lifeEvent.features || [];

    let featsHtml = '';
    features.forEach(f => {
      featsHtml += `
        <div class="p-3 border rounded mb-2 d-flex justify-content-between align-items-center bg-white">
          <div class="d-flex align-items-center">
            <i class="bi ${f.icon || 'bi-check-circle-fill'} text-primary h4 mb-0 mr-3"></i>
            <div>
              <strong class="text-dark">${f.name}</strong>
              <div class="text-muted small">${f.description || f.desc || ''}</div>
            </div>
          </div>
          <span class="badge badge-primary font-weight-bold">+${f.points || 15} PTS</span>
        </div>
      `;
    });

    content.innerHTML = `
      <div class="text-center mb-3">
        <span class="badge badge-warning text-dark font-weight-bold px-3 py-1">
          Confidence Level: ${Math.round(lifeEvent.confidence || 75)}%
        </span>
        <h4 class="font-weight-bold text-primary mt-2">${bundleName}</h4>
        <p class="text-muted small">${lifeEvent.description || ''}</p>
      </div>
      <div class="mb-3">
        <div class="small font-weight-bold text-muted mb-1">Sinyal Mutasi yang Memicu Deteksi:</div>
        <div>${signals.map(s => `<span class="badge badge-light border text-dark mr-1">${s}</span>`).join('')}</div>
      </div>
      <div class="mb-3">
        <div class="small font-weight-bold text-muted mb-2">Fitur-Fitur dalam Paket:</div>
        ${featsHtml}
      </div>
      <div class="alert alert-info border-0 text-center small font-weight-bold mb-0">
        🎁 Paket ini memberikan total akumulasi poin fitur serta tambahan bonus <strong>+${bonusPts} Poin Gamifikasi</strong>!
      </div>
    `;

    const claimBtn = document.getElementById('btnClaimModalBundle');
    if (claimBtn) {
      claimBtn.onclick = () => claimBundle(ruleId, bundleName);
    }

    modal.style.display = 'block';
    modal.classList.add('show');
  }

  function closeBundleModal() {
    const modal = document.getElementById('smartBundleModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
    }
  }

  function toggleInspector(forceState) {
    const drawer = document.getElementById('inspectorDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (!drawer || !backdrop) return;

    if (typeof forceState === 'boolean') {
      state.isInspectorOpen = forceState;
    } else {
      state.isInspectorOpen = !state.isInspectorOpen;
    }

    if (state.isInspectorOpen) {
      drawer.classList.add('open');
      backdrop.classList.add('show');
      fetchAuditLogs().then(renderAuditLogs);
    } else {
      drawer.classList.remove('open');
      backdrop.classList.remove('show');
    }
  }

  // ==========================================================================
  // Milestone 6: Voucher & Financial Target Quests System
  // ==========================================================================

  function renderVouchersSection() {
    const grid = document.getElementById('vouchersGrid');
    const metaCount = document.getElementById('voucherCountMeta');
    const badgeReady = document.getElementById('badgeReadyCount');
    if (!grid) return;

    const vouchers = state.vouchers || [];
    const readyCount = vouchers.filter(v => v.is_unlocked && !v.is_claimed).length;

    if (metaCount) {
      metaCount.textContent = readyCount > 0 
        ? `${vouchers.length} Voucher (${readyCount} Siap Klaim)`
        : `${vouchers.length} Voucher Tersedia`;
    }
    if (badgeReady) {
      if (readyCount > 0) {
        badgeReady.textContent = readyCount;
        badgeReady.classList.remove('d-none');
      } else {
        badgeReady.classList.add('d-none');
      }
    }

    const navVoucherBadge = document.getElementById('navVoucherBadge');
    if (navVoucherBadge) {
      if (readyCount > 0) {
        navVoucherBadge.textContent = readyCount;
        navVoucherBadge.classList.remove('d-none');
      } else {
        navVoucherBadge.classList.add('d-none');
      }
    }

    let filtered = vouchers;
    if (state.voucherFilter === 'ready') {
      filtered = vouchers.filter(v => v.is_unlocked && !v.is_claimed);
    } else if (state.voucherFilter === 'claimed') {
      filtered = vouchers.filter(v => v.is_claimed);
    }

    if (filtered.length === 0) {
      const filterLabel = state.voucherFilter === 'ready' 
        ? 'Siap Klaim' 
        : (state.voucherFilter === 'claimed' ? 'Sudah Diklaim' : '');
      grid.innerHTML = `
        <div class="m-voucher-empty-card">
          <div class="m-voucher-empty-icon">
            <i class="bi bi-ticket-perforated"></i>
          </div>
          <h6 class="font-weight-bold text-dark mb-1" style="font-size: 0.9rem;">Tidak Ada Voucher ${filterLabel ? `pada Kategori '${filterLabel}'` : ''}</h6>
          <p class="text-muted small mb-3" style="font-size: 0.74rem; line-height: 1.4;">
            ${state.voucherFilter === 'ready' 
              ? 'Selesaikan target transaksi atau tingkatkan skor finansialmu untuk membuka kupon diskon!'
              : 'Kamu belum memiliki voucher yang sudah diklaim.'}
          </p>
          <button type="button" class="btn btn-sm btn-outline-primary rounded-pill font-weight-bold px-3 py-1" onclick="app.setVoucherFilter('all')" style="font-size: 0.72rem;">
            <i class="bi bi-grid-fill mr-1"></i> Tampilkan Semua Voucher
          </button>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(v => {
      const isReady = v.is_unlocked && !v.is_claimed;
      const isClaimed = v.is_claimed;

      let cardStateClass = isReady ? 'is-ready' : (isClaimed ? 'is-claimed' : '');
      
      let statusPill = '';
      if (isClaimed) {
        statusPill = `<span class="m-vcard-pill pill-claimed"><i class="bi bi-check2-circle mr-1"></i>Diklaim</span>`;
      } else if (isReady) {
        statusPill = `<span class="m-vcard-pill pill-ready animate-pulse"><i class="bi bi-gift-fill mr-1"></i>SIAP KLAIM</span>`;
      } else {
        statusPill = `<span class="m-vcard-pill pill-locked"><i class="bi bi-lock-fill mr-1"></i>Terkunci</span>`;
      }

      // Brand Icon theme
      let brandTheme = 'icon-theme-lifestyle';
      const mLow = (v.merchant || '').toLowerCase();
      const cLow = (v.category || '').toLowerCase();
      if (mLow.includes('indomaret')) {
        brandTheme = 'icon-theme-indomaret';
      } else if (mLow.includes('kenangan') || cLow.includes('f&b') || cLow.includes('food')) {
        brandTheme = 'icon-theme-kenangan';
      } else if (mLow.includes('welma') || cLow.includes('invest')) {
        brandTheme = 'icon-theme-welma';
      } else if (mLow.includes('tokopedia') || mLow.includes('shopee') || cLow.includes('shop')) {
        brandTheme = 'icon-theme-tokopedia';
      }

      // Target quest icon & formatted description
      let questIcon = 'bi-bullseye text-primary';
      let questTitle = 'Target Finansial:';
      if (v.target_type === 'MIN_HEALTH_SCORE') {
        questIcon = 'bi-shield-heart-fill text-danger';
        questTitle = `Skor Finansial ≥ ${v.target_value} PTS`;
      } else if (v.target_type === 'CATEGORY_TX_COUNT') {
        questIcon = 'bi-cart-check-fill text-primary';
        questTitle = `${v.target_value}x Belanja '${v.target_category || 'Kebutuhan'}'`;
      } else if (v.target_type === 'MIN_SAVINGS_ALLOC') {
        questIcon = 'bi-piggy-bank-fill text-success';
        questTitle = `Alokasi Simpanan ≥ Rp ${formatIDR(v.target_value)}`;
      } else if (v.target_type === 'ACTIVE_FEATURE_COUNT') {
        questIcon = 'bi-lightning-charge-fill text-warning';
        questTitle = `Aktifkan ${v.target_value} Fitur Adaptif`;
      } else if (v.target_type === 'TOTAL_TX_COUNT') {
        questIcon = 'bi-receipt-cutoff text-info';
        questTitle = `Lakukan total ${v.target_value}x Transaksi`;
      } else {
        questTitle = `Target: ${v.target_type} (${v.target_value})`;
      }

      // Reward display text
      let rewardFormatted = '';
      let rewardTypeLabel = 'Diskon Belanja';
      if (v.reward_type === 'POINTS') {
        rewardFormatted = `+${formatIDR(v.reward_value)} Poin BCA`;
        rewardTypeLabel = 'Reward Poin';
      } else if (v.reward_type === 'CASHBACK') {
        rewardFormatted = `Rp ${formatIDR(v.reward_value)}`;
        rewardTypeLabel = 'Cashback';
      } else {
        rewardFormatted = `Rp ${formatIDR(v.reward_value)}`;
        rewardTypeLabel = 'Diskon Mitra';
      }

      // Format date nicely
      let expDisplay = v.expiry_date || '31 Des 2026';
      if (expDisplay.includes('-')) {
        const parts = expDisplay.split('-');
        if (parts.length === 3) {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          const mIdx = parseInt(parts[1], 10) - 1;
          expDisplay = `${parseInt(parts[2], 10)} ${months[mIdx] || parts[1]} ${parts[0]}`;
        }
      }

      // Action button
      let actionBtn = '';
      if (isClaimed) {
        actionBtn = `
          <button type="button" class="btn m-vbtn-claimed" onclick="app.viewVoucherSlip('${v.id}')">
            <i class="bi bi-ticket-perforated-fill"></i> Lihat Kode E-Voucher (${v.code})
          </button>
        `;
      } else if (isReady) {
        actionBtn = `
          <button type="button" class="btn m-vbtn-claim" onclick="app.claimVoucher('${v.id}')">
            <i class="bi bi-gift-fill"></i> Klaim Voucher Sekarang!
          </button>
        `;
      } else {
        actionBtn = `
          <button type="button" class="btn m-vbtn-locked" disabled>
            <i class="bi bi-lock-fill"></i> Misi Belum Tercapai (${v.progress_label})
          </button>
        `;
      }

      html += `
        <div class="m-vcard ${cardStateClass}">
          <!-- Top Reward & Merchant Info -->
          <div class="m-vcard-top">
            <div class="m-vcard-header">
              <div class="m-vcard-brand">
                <div class="m-vcard-icon ${brandTheme}">
                  <i class="bi ${v.icon || 'bi-gift-fill'}"></i>
                </div>
                <div class="m-vcard-brand-info">
                  <span class="m-vcard-merchant">${v.merchant || 'BCA Partner'}</span>
                  <span class="m-vcard-cat">${v.category || 'Promo'}</span>
                </div>
              </div>
              <div>
                ${statusPill}
              </div>
            </div>

            <div class="m-vcard-offer">
              <div class="m-vcard-reward-row">
                <span class="m-vcard-reward-type">${rewardTypeLabel}</span>
                <span class="m-vcard-reward-val">${rewardFormatted}</span>
              </div>
              <div class="m-vcard-title">${v.title}</div>
            </div>

            <div class="m-vcard-expiry">
              <i class="bi bi-calendar2-check mr-1 text-muted"></i>
              <span>Berlaku s/d ${expDisplay}</span>
            </div>
          </div>

          <!-- Real Perforated Ticket Notches & Dashed Line -->
          <div class="m-vcard-perforation">
            <span class="m-vcard-notch notch-left"></span>
            <span class="m-vcard-dash"></span>
            <span class="m-vcard-notch notch-right"></span>
          </div>

          <!-- Bottom Quest Progress & Action Button -->
          <div class="m-vcard-bottom">
            <div class="m-vcard-quest-box">
              <div class="m-vcard-quest-head">
                <span class="m-vcard-quest-title">
                  <i class="bi ${questIcon} mr-1"></i> ${questTitle}
                </span>
                <span class="m-vcard-quest-ratio ${v.is_unlocked ? 'text-success' : 'text-primary'}">
                  ${v.progress_label} (${v.progress_percent}%)
                </span>
              </div>
              <div class="m-vcard-prog-track">
                <div class="m-vcard-prog-fill ${v.is_unlocked ? 'fill-success' : 'fill-primary'}" style="width: ${v.progress_percent}%"></div>
              </div>
            </div>

            <div class="m-vcard-action">
              ${actionBtn}
            </div>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  function setVoucherFilter(filter) {
    state.voucherFilter = filter || 'all';
    document.querySelectorAll('#voucherFilterTabs .m-vfilter-pill, #voucherFilterTabs button').forEach(b => {
      if ((b.getAttribute('data-vfilter') || 'all') === state.voucherFilter) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
    renderVouchersSection();
  }

  async function claimVoucher(voucherId) {
    try {
      const res = await apiFetch(`/api/vouchers/claim/${voucherId}`, { method: 'POST' });
      showToast(res.message || 'Selamat! Voucher berhasil kamu klaim.', 'success');

      await fetchVouchers();
      await fetchAIStatus();
      renderAll();

      viewVoucherSlip(voucherId);
    } catch (err) {
      showToast(err.message || 'Gagal mengklaim voucher.', 'error');
    }
  }

  function viewVoucherSlip(voucherId) {
    const v = (state.vouchers || []).find(x => x.id === voucherId);
    if (!v) return;

    state.selectedClaimedVoucher = v;

    const modal = document.getElementById('userVoucherClaimModal');
    const merchantBadge = document.getElementById('claimModalMerchantBadge');
    const title = document.getElementById('claimModalTitle');
    const desc = document.getElementById('claimModalDesc');
    const code = document.getElementById('claimModalCode');
    const barcodeText = document.getElementById('claimModalBarcodeText');
    const targetAchieved = document.getElementById('claimModalTargetAchieved');
    const expiry = document.getElementById('claimModalExpiry');

    if (merchantBadge) merchantBadge.textContent = (v.merchant || 'BCA PARTNER').toUpperCase();
    if (title) title.textContent = v.title;
    if (desc) desc.textContent = v.description;
    if (code) code.textContent = v.code;
    if (barcodeText) barcodeText.textContent = `${v.code}-${new Date().getFullYear()}`;
    if (targetAchieved) targetAchieved.textContent = v.progress_label;
    if (expiry) expiry.textContent = v.expiry_date || '31 Des 2026';

    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('show');
    }
  }

  function closeUserClaimModal() {
    const modal = document.getElementById('userVoucherClaimModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
    }
  }

  function copyVoucherCode() {
    if (!state.selectedClaimedVoucher) return;
    navigator.clipboard.writeText(state.selectedClaimedVoucher.code)
      .then(() => {
        showToast(`Kode "${state.selectedClaimedVoucher.code}" berhasil disalin ke clipboard!`, 'success');
      })
      .catch(() => {
        showToast(`Kode: ${state.selectedClaimedVoucher.code}`);
      });
  }

  function useVoucherNow() {
    closeUserClaimModal();
    if (state.selectedClaimedVoucher) {
      showToast(`Membuka voucher "${state.selectedClaimedVoucher.title}" di mitra ${state.selectedClaimedVoucher.merchant}...`, 'info');
    }
  }

  // --- Privacy & AI Settings Modal (UU PDP - Bab 4.3.f) ---

  function openPrivacyModal() {
    const modal = document.getElementById('privacySettingsModal');
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('show');
    }
  }

  function closePrivacyModal() {
    const modal = document.getElementById('privacySettingsModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
    }
  }

  function togglePrivacySetting(settingKey, isEnabled) {
    if (settingKey === 'personalization') {
      showToast(isEnabled 
        ? 'Personalisasi Transaksi (Algoritma 1) aktif.' 
        : 'Personalisasi Transaksi dijeda (Privasi UU PDP).', 'info');
    } else if (settingKey === 'lifeEvent') {
      showToast(isEnabled 
        ? 'Deteksi Life Event (Algoritma 2) aktif.' 
        : 'Deteksi Life Event dijeda (Privasi UU PDP).', 'info');
    }
  }

  // --- Admin Voucher Management Functions ---

  async function openAdminVoucherModal() {
    if (state.user?.id !== 'admin') {
      showToast('Akses ditolak: Hanya akun Administrator (Admin Portal & PM) yang dapat mengelola voucher & target misi.', 'warning');
      return;
    }
    const modal = document.getElementById('adminVoucherModal');
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('show');
    }
    await loadAdminVouchersList();
  }

  function closeAdminVoucherModal() {
    const modal = document.getElementById('adminVoucherModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
    }
  }

  async function loadAdminVouchersList() {
    const tbody = document.getElementById('adminVouchersTableBody');
    const countBadge = document.getElementById('adminVoucherListCount');
    if (!tbody) return;

    try {
      const res = await apiFetch('/api/admin/vouchers');
      state.adminVouchers = res.data || [];
      if (countBadge) countBadge.textContent = state.adminVouchers.length;

      if (state.adminVouchers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">Belum ada voucher yang dibuat.</td></tr>';
        return;
      }

      let html = '';
      state.adminVouchers.forEach(v => {
        let questDesc = '';
        if (v.target_type === 'MIN_HEALTH_SCORE') {
          questDesc = `Skor Min. ${v.target_value} PTS`;
        } else if (v.target_type === 'CATEGORY_TX_COUNT') {
          questDesc = `${v.target_value}x '${v.target_category || 'Pos'}'`;
        } else if (v.target_type === 'MIN_SAVINGS_ALLOC') {
          questDesc = `Tabungan Min. Rp ${formatIDR(v.target_value)}`;
        } else if (v.target_type === 'ACTIVE_FEATURE_COUNT') {
          questDesc = `${v.target_value} Fitur Aktif`;
        } else if (v.target_type === 'TOTAL_TX_COUNT') {
          questDesc = `${v.target_value} Transaksi`;
        } else {
          questDesc = `${v.target_type} (${v.target_value})`;
        }

        html += `
          <tr>
            <td>
              <strong class="text-primary font-monospace">${v.code}</strong>
              <div class="small text-muted">${v.merchant} (${v.category})</div>
            </td>
            <td>
              <div class="font-weight-semibold text-dark">${v.title}</div>
              <div class="small text-muted text-truncate" style="max-width: 260px;">${v.description || '-'}</div>
            </td>
            <td>
              <span class="badge badge-warning text-dark font-weight-bold">
                <i class="bi bi-bullseye mr-1"></i>${questDesc}
              </span>
            </td>
            <td>
              <strong class="text-success">Rp ${formatIDR(v.reward_value)}</strong>
              <div class="small text-muted">${v.reward_type}</div>
            </td>
            <td>
              <span class="badge badge-light border">
                <i class="bi bi-people-fill text-primary mr-1"></i>${v.claim_count || 0} Klaim
              </span>
            </td>
            <td class="text-center">
              <button type="button" class="btn btn-outline-danger btn-sm p-1" title="Hapus Voucher" onclick="app.deleteAdminVoucher('${v.id}', '${v.title}')">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    } catch (err) {
      console.error('Failed to load admin vouchers:', err);
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-danger">Gagal memuat daftar voucher: ${err.message}</td></tr>`;
    }
  }

  async function handleAdminCreateVoucher(e) {
    e.preventDefault();
    const title = document.getElementById('adminVoucherTitle')?.value;
    const merchant = document.getElementById('adminVoucherMerchant')?.value;
    const category = document.getElementById('adminVoucherCategory')?.value;
    const reward_type = document.getElementById('adminVoucherRewardType')?.value;
    const reward_value = parseInt(document.getElementById('adminVoucherRewardValue')?.value, 10);
    const code = document.getElementById('adminVoucherCode')?.value;
    const expiry_date = document.getElementById('adminVoucherExpiry')?.value;
    const target_type = document.getElementById('adminVoucherTargetType')?.value;
    const target_value = parseInt(document.getElementById('adminVoucherTargetValue')?.value, 10);
    const target_category = document.getElementById('adminVoucherTargetCategory')?.value;
    const description = document.getElementById('adminVoucherDesc')?.value;

    const payload = {
      title,
      merchant,
      category,
      reward_type,
      reward_value,
      code: code || undefined,
      expiry_date: expiry_date || '2026-12-31',
      target_type,
      target_value,
      target_category: target_type === 'CATEGORY_TX_COUNT' ? target_category : null,
      description: description || undefined
    };

    try {
      const res = await apiFetch('/api/admin/vouchers', {
        method: 'POST',
        body: payload
      });

      showToast(res.message || 'Voucher & target berhasil dibuat!', 'success');
      
      // Reset form
      document.getElementById('adminCreateVoucherForm').reset();
      document.getElementById('adminVoucherExpiry').value = '2026-12-31';

      // Switch to list tab
      const listTab = document.getElementById('tab-list-voucher');
      if (listTab) {
        listTab.click();
      }
      await loadAdminVouchersList();
      await loadDashboardData();
    } catch (err) {
      showToast(err.message || 'Gagal membuat voucher.', 'error');
    }
  }

  async function deleteAdminVoucher(voucherId, voucherTitle) {
    if (!confirm(`Apakah Anda yakin ingin menghapus voucher "${voucherTitle}"?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/vouchers/${voucherId}`, { method: 'DELETE' });
      showToast(res.message || 'Voucher berhasil dihapus.', 'info');
      await loadAdminVouchersList();
      await loadDashboardData();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus voucher.', 'error');
    }
  }

  // ==========================================================================
  // Initialization & Event Binding
  // ==========================================================================

  async function init() {
    // 1. Fetch Personas Catalog for Dropdown and Switcher
    try {
      const pRes = await apiFetch('/api/personas');
      state.personas = pRes.data || pRes || [];

      // Populate Navbar Persona Dropdown
      const dashPersonaSelect = document.getElementById('dashPersonaSelect');
      if (dashPersonaSelect) {
        dashPersonaSelect.innerHTML = '';
        state.personas.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = `${p.name} (${p.title || p.occupation})`;
          dashPersonaSelect.appendChild(opt);
        });

        dashPersonaSelect.addEventListener('change', (e) => {
          handleQuickLogin(e.target.value);
        });
      }
    } catch (err) {
      console.warn('Could not fetch personas catalog:', err);
    }

    // 2. Event Listeners for Login Form & Quick Switcher
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

    document.querySelectorAll('.persona-chip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const personaId = e.currentTarget.getAttribute('data-persona');
        if (personaId) handleQuickLogin(personaId);
      });
    });

    const togglePasswordBtn = document.getElementById('toggleLoginPassword');
    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', () => {
        const pwdInput = document.getElementById('inputPassword');
        const eyeIcon = document.getElementById('loginEyeIcon');
        if (pwdInput.type === 'password') {
          pwdInput.type = 'text';
          eyeIcon.className = 'bi bi-eye';
        } else {
          pwdInput.type = 'password';
          eyeIcon.className = 'bi bi-eye-slash';
        }
      });
    }

    // Login Segmented Tab Switcher (Form Login vs Persona Demo)
    const tabBtnFormLogin = document.getElementById('tabBtnFormLogin');
    const tabBtnPersonaDemo = document.getElementById('tabBtnPersonaDemo');
    const cardFormLogin = document.getElementById('cardFormLogin');
    const cardPersonaDemo = document.getElementById('cardPersonaDemo');

    if (tabBtnFormLogin && tabBtnPersonaDemo && cardFormLogin && cardPersonaDemo) {
      tabBtnFormLogin.addEventListener('click', () => {
        tabBtnFormLogin.classList.add('active');
        tabBtnPersonaDemo.classList.remove('active');
        cardFormLogin.classList.remove('d-none');
        cardPersonaDemo.classList.add('d-none');
      });

      tabBtnPersonaDemo.addEventListener('click', () => {
        tabBtnPersonaDemo.classList.add('active');
        tabBtnFormLogin.classList.remove('active');
        cardPersonaDemo.classList.remove('d-none');
        cardFormLogin.classList.add('d-none');
      });
    }

    // Biometric 1-Tap Quick Access Button
    const btnBiometricLogin = document.getElementById('btnBiometricLogin');
    if (btnBiometricLogin) {
      btnBiometricLogin.addEventListener('click', () => {
        handleQuickLogin('dimas');
      });
    }

    // 3. Event Listeners for Dashboard Controls
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const toggleBalanceBtn = document.getElementById('btnToggleBalance');
    if (toggleBalanceBtn) {
      toggleBalanceBtn.addEventListener('click', () => {
        state.isBalanceMasked = !state.isBalanceMasked;
        renderAccountBalanceCard();
      });
    }

    const toggleBcaIdBtn = document.getElementById('toggleBcaIdMask');
    if (toggleBcaIdBtn) {
      toggleBcaIdBtn.addEventListener('click', () => {
        state.isBcaIdMasked = !state.isBcaIdMasked;
        renderCustomerHeader();
      });
    }

    // Period Tabs Filter
    document.querySelectorAll('#txPeriodTabs button').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const period = e.currentTarget.getAttribute('data-period');
        await fetchTransactions(period);
        renderMutasiHistory();
        renderCashflow();
      });
    });

    // Manual Transaction Form
    const addTxForm = document.getElementById('addTxForm');
    if (addTxForm) addTxForm.addEventListener('submit', handleAddTransactionSubmit);

    // AI Smart Injector Example Chips
    document.querySelectorAll('.example-tx-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const desc = e.currentTarget.getAttribute('data-desc');
        const amount = e.currentTarget.getAttribute('data-amount');
        const txDesc = document.getElementById('txDesc');
        const txAmount = document.getElementById('txAmount');
        if (txDesc) txDesc.value = desc;
        if (txAmount) txAmount.value = amount;
        showToast(`💡 Contoh dipilih: ${desc} (${formatIDR(Number(amount))})`);

        const previewBox = document.getElementById('aiCategoryPreview');
        const previewCatName = document.getElementById('previewCatName');
        const previewCatType = document.getElementById('previewCatType');
        const previewReason = document.getElementById('previewReason');
        if (previewBox && previewCatName && previewCatType) {
          const isCr = desc.toLowerCase().includes('gaji');
          let cat = 'Belanja & Lainnya';
          if (isCr) cat = 'Gaji & Payroll';
          else if (desc.toLowerCase().includes('kos')) cat = 'Hunian & Kos';
          else if (desc.toLowerCase().includes('kopi') || desc.toLowerCase().includes('kafe')) cat = 'Jajan & Gaya Hidup';
          else if (desc.toLowerCase().includes('belanja')) cat = 'Belanja Kebutuhan Pokok';
          else if (desc.toLowerCase().includes('investasi')) cat = 'Investasi & Tabungan';
          else if (desc.toLowerCase().includes('asuransi')) cat = 'Proteksi Asuransi';

          previewCatName.textContent = cat;
          previewCatType.textContent = isCr ? 'CR (Masuk +)' : 'DB (Keluar -)';
          previewCatType.className = isCr ? 'badge badge-success ml-1' : 'badge badge-danger ml-1';
          if (previewReason) previewReason.textContent = 'Deteksi otomatis AI Engine';
          previewBox.classList.remove('d-none');
          previewBox.classList.add('d-flex');
        }
      });
    });

    // Reset Database Buttons
    const resetDbBtn = document.getElementById('btnResetDb');
    if (resetDbBtn) resetDbBtn.addEventListener('click', handleResetDatabase);

    const resetDbTopBtn = document.getElementById('btnResetDbTop');
    if (resetDbTopBtn) resetDbTopBtn.addEventListener('click', handleResetDatabase);

    // Inspector Drawer Controls
    const toggleInspectorBtn = document.getElementById('btnToggleInspector');
    if (toggleInspectorBtn) toggleInspectorBtn.addEventListener('click', () => toggleInspector());

    const closeInspectorBtn = document.getElementById('btnCloseInspector');
    if (closeInspectorBtn) closeInspectorBtn.addEventListener('click', () => toggleInspector(false));

    const drawerBackdrop = document.getElementById('drawerBackdrop');
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', () => toggleInspector(false));

    const refreshLogsBtn = document.getElementById('btnRefreshLogs');
    if (refreshLogsBtn) refreshLogsBtn.addEventListener('click', async () => {
      await fetchAuditLogs();
      renderAuditLogs();
      showToast('Decision trace logs diperbarui.');
    });

    // Modal Controls
    const closeModalBtn = document.getElementById('btnCloseModal');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeBundleModal);

    const dismissModalBtn = document.getElementById('btnDismissModal');
    if (dismissModalBtn) dismissModalBtn.addEventListener('click', closeBundleModal);

    // Onboarding Modal Controls
    const closeOnboardingBtn = document.getElementById('btnCloseOnboardingModal');
    if (closeOnboardingBtn) closeOnboardingBtn.addEventListener('click', closeOnboardingModal);

    const cancelOnboardingBtn = document.getElementById('btnCancelOnboarding');
    if (cancelOnboardingBtn) cancelOnboardingBtn.addEventListener('click', closeOnboardingModal);

    // Voucher Filter Tabs Controls
    document.querySelectorAll('#voucherFilterTabs .m-vfilter-pill, #voucherFilterTabs button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filterVal = e.currentTarget.getAttribute('data-vfilter') || 'all';
        setVoucherFilter(filterVal);
      });
    });

    // Admin Voucher Modal Controls
    const openAdminVoucherBtn = document.getElementById('btnOpenAdminVouchers');
    if (openAdminVoucherBtn) openAdminVoucherBtn.addEventListener('click', openAdminVoucherModal);

    const closeAdminVoucherBtn = document.getElementById('btnCloseAdminVoucherModal');
    if (closeAdminVoucherBtn) closeAdminVoucherBtn.addEventListener('click', closeAdminVoucherModal);

    const cancelAdminVoucherBtn = document.getElementById('btnCancelAdminVoucher');
    if (cancelAdminVoucherBtn) cancelAdminVoucherBtn.addEventListener('click', closeAdminVoucherModal);

    const closeAdminVoucherFooterBtn = document.getElementById('btnCloseAdminVoucherFooter');
    if (closeAdminVoucherFooterBtn) closeAdminVoucherFooterBtn.addEventListener('click', closeAdminVoucherModal);

    const refreshAdminVouchersBtn = document.getElementById('btnRefreshAdminVouchers');
    if (refreshAdminVouchersBtn) refreshAdminVouchersBtn.addEventListener('click', loadAdminVouchersList);

    // User Voucher Claim Modal Controls
    const closeUserClaimBtn = document.getElementById('btnCloseUserClaimModal');
    if (closeUserClaimBtn) closeUserClaimBtn.addEventListener('click', closeUserClaimModal);

    const dismissUserClaimBtn = document.getElementById('btnDismissUserClaim');
    if (dismissUserClaimBtn) dismissUserClaimBtn.addEventListener('click', closeUserClaimModal);

    // Universal Backdrop Click to Dismiss Any Open Modal
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
          modal.classList.remove('show');
        }
      });
    });

    // ESC key to close any active modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(m => {
          m.style.display = 'none';
          m.classList.remove('show');
        });
      }
    });

    // Admin Voucher Form Target Type Change Handler
    const targetTypeSelect = document.getElementById('adminVoucherTargetType');
    const catContainer = document.getElementById('adminCategoryContainer');
    const targetHelp = document.getElementById('adminTargetHelpText');
    if (targetTypeSelect) {
      targetTypeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (catContainer) {
          if (val === 'CATEGORY_TX_COUNT') {
            catContainer.classList.remove('d-none');
          } else {
            catContainer.classList.add('d-none');
          }
        }
        if (targetHelp) {
          if (val === 'MIN_HEALTH_SCORE') {
            targetHelp.textContent = 'Contoh: Isi 70 jika target adalah skor gamifikasi minimal 70 PTS (Gold Tier).';
          } else if (val === 'CATEGORY_TX_COUNT') {
            targetHelp.textContent = 'Contoh: Isi 2 jika target adalah melakukan minimal 2x transaksi pada pos kategori di bawah.';
          } else if (val === 'MIN_SAVINGS_ALLOC') {
            targetHelp.textContent = 'Contoh: Isi 500000 jika target adalah mengalokasikan tabungan/investasi minimal Rp 500.000.';
          } else if (val === 'ACTIVE_FEATURE_COUNT') {
            targetHelp.textContent = 'Contoh: Isi 3 jika target adalah mengaktifkan minimal 3 fitur kesehatan finansial.';
          } else if (val === 'TOTAL_TX_COUNT') {
            targetHelp.textContent = 'Contoh: Isi 5 jika target adalah melakukan total minimal 5 transaksi.';
          } else if (val === 'MIN_SPEND_AMOUNT') {
            targetHelp.textContent = 'Contoh: Isi 200000 jika target adalah total pengeluaran belanja minimal Rp 200.000.';
          }
        }
      });
    }

    const adminForm = document.getElementById('adminCreateVoucherForm');
    if (adminForm) adminForm.addEventListener('submit', handleAdminCreateVoucher);

    // Frame View Mode Toggle (iPhone 14 / Full Width)
    const toggleFrameBtn = document.getElementById('btnToggleFrameMode');
    if (toggleFrameBtn) {
      toggleFrameBtn.addEventListener('click', () => {
        const frame = document.getElementById('deviceFrame');
        const icon = document.getElementById('frameToggleIcon');
        const text = document.getElementById('frameToggleText');
        if (frame) {
          frame.classList.toggle('full-width-mode');
          const isFull = frame.classList.contains('full-width-mode');
          if (icon) icon.className = isFull ? 'bi bi-phone-fill' : 'bi bi-phone';
          if (text) text.textContent = isFull ? 'iPhone 14' : 'Full Width';
          showToast(isFull ? 'Mode Layar Diperlebar' : 'Mode Presisi iPhone 14');
        }
      });
    }

    // Modal background dismiss for User Voucher Modal
    const userVoucherModal = document.getElementById('userVoucherClaimModal');
    if (userVoucherModal) {
      userVoucherModal.addEventListener('click', (e) => {
        if (e.target === userVoucherModal) closeUserClaimModal();
      });
    }

    // Modal background dismiss for Admin Voucher Modal
    const adminVoucherModal = document.getElementById('adminVoucherModal');
    if (adminVoucherModal) {
      adminVoucherModal.addEventListener('click', (e) => {
        if (e.target === adminVoucherModal) closeAdminVoucherModal();
      });
    }

    // Modal background dismiss for Privacy Settings Modal (UU PDP)
    const privacyModal = document.getElementById('privacySettingsModal');
    if (privacyModal) {
      privacyModal.addEventListener('click', (e) => {
        if (e.target === privacyModal) closePrivacyModal();
      });
    }

    // 4. Session Auto-Restore
    if (state.token) {
      try {
        const sessionRes = await apiFetch('/api/auth/session');
        state.user = sessionRes.user || sessionRes.data?.user;
        state.account = sessionRes.account || sessionRes.data?.account;

        switchView('dashboard');
        await loadDashboardData();
      } catch (err) {
        console.warn('Invalid session, clearing token:', err);
        state.token = null;
        localStorage.removeItem('mybca_token');
        switchView('login');
      }
    } else {
      switchView('login');
    }
  }

  // Expose public controller functions to global scope
  window.app = {
    init,
    state,
    handleQuickLogin,
    activateFeature,
    openFeatureOnboarding,
    selectOnboardingProduct,
    setOnboardingAmount,
    handleManualAmountInput,
    confirmFeatureOnboarding,
    closeOnboardingModal,
    claimBundle,
    openBundleModal,
    closeBundleModal,
    triggerScenario,
    handleResetDatabase,
    openAdminVoucherModal,
    closeAdminVoucherModal,
    claimVoucher,
    viewVoucherSlip,
    setVoucherFilter,
    closeUserClaimModal,
    copyVoucherCode,
    useVoucherNow,
    openPrivacyModal,
    closePrivacyModal,
    togglePrivacySetting,
    deleteAdminVoucher,
    quickSimulateAction: function (actionName) {
      if (actionName === 'Investasi' || actionName === 'Welma') {
        openFeatureOnboarding('conservative_invest', 'Investasi Welma (Reksa Dana & Deposito)');
      } else if (actionName === 'Proteksi') {
        openFeatureOnboarding('health_insurance', 'Asuransi Kesehatan Mandiri BCA Life');
      } else if (actionName === 'Paylater') {
        openFeatureOnboarding('paylater_reminder', 'BCA Paylater Smart Reminder');
      } else {
        showToast(`Fitur "${actionName}" dipilih (Simulasi Menu Cepat Perbankan).`);
      }
    }
  };

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', init);

})();
