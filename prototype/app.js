/**
 * APP CONTROLLER - myBCA ADAPT Prototype
 * Reactive UI Manager & Interaction Handlers
 */

document.addEventListener("DOMContentLoaded", () => {
  const engine = new MyBCAAdaptEngine(SEED_DATABASE);
  let currentPersona = SEED_DATABASE.personas[0]; // Default: Dimas
  let inspectorVisible = true;

  // DOM Elements
  const personaSelect = document.getElementById("personaSelect");
  const inspectorToggle = document.getElementById("inspectorToggle");
  const mainWrapper = document.getElementById("mainWrapper");
  const inspectorPanel = document.getElementById("inspectorPanel");

  // Render Initial Persona Dropdown
  SEED_DATABASE.personas.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.title})`;
    personaSelect.appendChild(opt);
  });

  // Handle Persona Selection Change
  personaSelect.addEventListener("change", (e) => {
    const found = SEED_DATABASE.personas.find(p => p.id === e.target.value);
    if (found) {
      currentPersona = found;
      engine.log("SYSTEM", `Memuat ulang persona: ${currentPersona.name}`);
      renderAll();
    }
  });

  // Handle Inspector Panel Toggle
  inspectorToggle.addEventListener("click", () => {
    inspectorVisible = !inspectorVisible;
    if (inspectorVisible) {
      mainWrapper.classList.add("inspector-open");
      inspectorPanel.style.display = "flex";
      inspectorToggle.innerHTML = `<i class="bi bi-cpu-fill"></i> Sembunyikan Audit Inspector`;
    } else {
      mainWrapper.classList.remove("inspector-open");
      inspectorPanel.style.display = "none";
      inspectorToggle.innerHTML = `<i class="bi bi-cpu"></i> Tampilkan Audit Inspector (Mode Juri)`;
    }
  });

  // Main Render Function
  function renderAll() {
    renderPersonaHeader();
    renderGamificationCard();
    renderLifeEventBanner();
    renderRecommendationsFeed();
    renderTransactionsTable();
    renderScenarioButtons();
    renderLogs();
  }

  // 1. Render Persona Header & Quick Stats
  function renderPersonaHeader() {
    document.getElementById("personaAvatar").src = currentPersona.avatar;
    document.getElementById("personaName").textContent = currentPersona.name;
    document.getElementById("personaTitle").textContent = `${currentPersona.title} • ${currentPersona.occupation}`;
    document.getElementById("personaAccountNo").textContent = currentPersona.accountNo;
    document.getElementById("personaBalance").textContent = `Rp ${currentPersona.balance.toLocaleString("id-ID")}`;
  }

  // 2. Render Gamification Score Card (Algoritma 3)
  function renderGamificationCard() {
    const gamificationResult = engine.calcGamificationScore(currentPersona);

    const scoreNumEl = document.getElementById("scoreNum");
    const scoreProgressFill = document.getElementById("scoreProgressFill");
    const tierBadgeEl = document.getElementById("tierBadge");
    const rewardPointsEl = document.getElementById("rewardPoints");
    const scoreBreakdownEl = document.getElementById("scoreBreakdown");

    // Animate score counter
    scoreNumEl.textContent = gamificationResult.score;
    scoreProgressFill.style.width = `${gamificationResult.score}%`;

    tierBadgeEl.className = `tier-badge ${gamificationResult.badgeClass}`;
    tierBadgeEl.innerHTML = `<i class="bi bi-award-fill"></i> Level ${gamificationResult.tier}`;

    rewardPointsEl.textContent = `${gamificationResult.rewardPoints.toLocaleString("id-ID")} Poin`;

    // Render Breakdown
    const b = gamificationResult.breakdown;
    let html = `
      <div class="breakdown-item">
        <span><i class="bi bi-check-circle-fill text-primary"></i> Skor Dasar Platform</span>
        <span class="breakdown-val">+${b.baseScore} PTS</span>
      </div>
    `;

    b.activeFeatures.forEach(af => {
      html += `
        <div class="breakdown-item">
          <span><i class="bi bi-plus-circle-fill text-success"></i> Fitur Aktif: ${af.name}</span>
          <span class="breakdown-val">+${af.pts} PTS</span>
        </div>
      `;
    });

    if (b.timelinessBonus > 0) {
      html += `
        <div class="breakdown-item">
          <span><i class="bi bi-star-fill text-warning"></i> Ketepatan Bayar Tagihan (100%)</span>
          <span class="breakdown-val">+${b.timelinessBonus} PTS</span>
        </div>
      `;
    }

    if (b.savingsBonus > 0) {
      html += `
        <div class="breakdown-item">
          <span><i class="bi bi-graph-up-arrow text-info"></i> Konsistensi Menabung/Investasi</span>
          <span class="breakdown-val">+${b.savingsBonus} PTS</span>
        </div>
      `;
    }

    scoreBreakdownEl.innerHTML = html;
  }

  // 3. Render Life Event Banner (Algoritma 2)
  function renderLifeEventBanner() {
    const bannerContainer = document.getElementById("lifeEventContainer");
    const detectedEvent = engine.detectLifeEvent(currentPersona.historyBaseline, currentPersona.historyCurrent);

    if (!detectedEvent) {
      bannerContainer.innerHTML = `
        <div class="life-event-banner" style="background: linear-gradient(135deg, #1e293b, #0f172a); opacity: 0.9;">
          <span class="bundle-badge" style="background: #64748b; color: white;">Monitoring Sinyal Fase Hidup</span>
          <div class="bundle-title"><i class="bi bi-radar"></i> Belum Ada Momen Transisi Hidup Baru</div>
          <div class="bundle-desc">Engine myBCA ADAPT terus menganalisis perubahan pola transaksi bulanan Anda secara otomatis.</div>
        </div>
      `;
      return;
    }

    const rule = detectedEvent.rule;

    let featuresHtml = rule.featuresToBundle.map(fid => {
      const feat = SEED_DATABASE.features[fid];
      return `
        <div class="bundle-feature-item">
          <i class="bi ${feat ? feat.icon : 'bi-check-lg'}"></i>
          <span>${feat ? feat.name : fid}</span>
        </div>
      `;
    }).join("");

    bannerContainer.innerHTML = `
      <div class="life-event-banner">
        <span class="bundle-badge"><i class="bi bi-stars"></i> Momen Hidup Terdeteksi (${detectedEvent.confidence}% Confidence)</span>
        <div class="bundle-title"><i class="bi bi-gift-fill"></i> ${rule.bundleName}</div>
        <div class="bundle-desc">${rule.desc}</div>
        <div style="font-size: 0.8rem; color: #38bdf8; margin-bottom: 0.75rem;">
          <strong>Sinyal Transaksi:</strong> ${detectedEvent.detectedSignals.join(', ')}
        </div>
        <div class="bundle-features-grid">
          ${featuresHtml}
        </div>
        <button id="claimBundleBtn" class="btn-claim-bundle">
          <i class="bi bi-lightning-charge-fill"></i> Aktifkan Paket Bundle Sekaligus (+${rule.bonusPoints} PTS Bonus)
        </button>
      </div>
    `;

    document.getElementById("claimBundleBtn")?.addEventListener("click", () => {
      rule.featuresToBundle.forEach(fid => {
        if (!currentPersona.activeFeatures.includes(fid)) {
          currentPersona.activeFeatures.push(fid);
        }
      });
      showToast(`🎉 Selamat! Bundle "${rule.bundleName}" berhasil diaktifkan! Skor Kesehatan Anda bertambah!`);
      engine.log("USER_ACTION", `User mengaktifkan bundle: ${rule.bundleName}`);
      renderAll();
    });
  }

  // 4. Render Recommendations Feed (Algoritma 1)
  function renderRecommendationsFeed() {
    const recListEl = document.getElementById("recommendationsList");
    const recs = engine.calcPropensityScores(currentPersona.historyCurrent, currentPersona.activeFeatures);

    if (recs.length === 0) {
      recListEl.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--bca-muted);">
          <i class="bi bi-check-circle" style="font-size: 2.5rem; color: #16a34a;"></i>
          <p style="margin-top: 0.5rem; font-weight: 600;">Semua Fitur Rekomendasi Utama Telah Aktif!</p>
        </div>
      `;
      return;
    }

    let html = "";
    recs.slice(0, 3).forEach(item => {
      const feat = item.feature;
      html += `
        <div class="rec-item">
          <div class="rec-icon">
            <i class="bi ${feat.icon}"></i>
          </div>
          <div class="rec-content">
            <div class="rec-title">${feat.name}</div>
            <div class="rec-reason"><i class="bi bi-cpu-fill"></i> ${item.reason}</div>
            <div class="rec-desc">${feat.desc}</div>
            <div class="rec-actions">
              <span class="score-tag"><i class="bi bi-bar-chart-fill"></i> Propensity Match: ${item.score}%</span>
              <button class="btn-activate" data-featid="${feat.id}">
                <i class="bi bi-plus-lg"></i> Aktifkan 1-Tap (+${feat.points} PTS)
              </button>
            </div>
          </div>
        </div>
      `;
    });

    recListEl.innerHTML = html;

    // Add click event to activate buttons
    recListEl.querySelectorAll(".btn-activate").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const featId = e.currentTarget.getAttribute("data-featid");
        if (featId && !currentPersona.activeFeatures.includes(featId)) {
          currentPersona.activeFeatures.push(featId);
          const feat = SEED_DATABASE.features[featId];
          showToast(`✅ Fitur "${feat.name}" berhasil diaktifkan! (+${feat.points} PTS)`);
          engine.log("USER_ACTION", `Fitur diaktifkan: ${feat.name}`);
          renderAll();
        }
      });
    });
  }

  // 5. Render Transaction Table
  function renderTransactionsTable() {
    const tableBody = document.getElementById("txTableBody");
    const allTx = currentPersona.historyCurrent;

    let html = "";
    allTx.forEach(tx => {
      const isPositive = tx.category.includes("Masuk") || tx.category.includes("Gaji") || tx.category.includes("QRIS");
      const sign = isPositive ? "+" : "-";
      const amtClass = isPositive ? "positive" : "negative";

      html += `
        <tr>
          <td>${tx.date}</td>
          <td><i class="bi ${tx.icon || 'bi-receipt'} text-primary me-1"></i> ${tx.desc}</td>
          <td><span class="badge bg-light text-dark border">${tx.category}</span></td>
          <td class="tx-amount ${amtClass}">${sign} Rp ${tx.amount.toLocaleString("id-ID")}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  // 6. Render Scenario Buttons
  function renderScenarioButtons() {
    const container = document.getElementById("scenariosContainer");
    let html = "";
    SEED_DATABASE.scenarios.forEach(scen => {
      html += `
        <button class="btn-scenario" data-scenid="${scen.id}">
          ${scen.name}
        </button>
      `;
    });
    container.innerHTML = html;

    container.querySelectorAll(".btn-scenario").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const scenId = e.currentTarget.getAttribute("data-scenid");
        const scen = SEED_DATABASE.scenarios.find(s => s.id === scenId);
        if (scen) {
          // Switch persona to scenario persona
          const persona = SEED_DATABASE.personas.find(p => p.id === scen.personaId);
          if (persona) {
            currentPersona = persona;
            personaSelect.value = persona.id;
            // Inject transactions
            scen.injectTransactions.forEach(t => {
              currentPersona.historyCurrent.unshift(t);
            });
            showToast(`⚡ Simulasi Skenario Berhasil Disuntikkan! Engine Merecalculasi...`);
            engine.log("SIMULATION", `Mengeksekusi skenario: ${scen.name}`);
            renderAll();
          }
        }
      });
    });
  }

  // 7. Render Inspector Log Stream
  function renderLogs() {
    const logContainer = document.getElementById("logStream");
    if (!logContainer) return;

    let html = "";
    engine.logs.forEach(l => {
      html += `
        <div class="log-entry">
          <span class="log-time">[${l.timestamp}]</span>
          <span class="log-engine">[${l.engine}]</span>
          <span class="log-msg">${l.message}</span>
        </div>
      `;
    });
    logContainer.innerHTML = html;
  }

  // Form Submit: Add New Manual Transaction
  document.getElementById("addTxForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const desc = document.getElementById("txDesc").value;
    const cat = document.getElementById("txCat").value;
    const amount = parseInt(document.getElementById("txAmount").value) || 0;
    const date = new Date().toISOString().split('T')[0];

    if (desc && amount > 0) {
      currentPersona.historyCurrent.unshift({
        date: date,
        category: cat,
        amount: amount,
        desc: desc,
        icon: "bi-plus-circle"
      });
      showToast(`📝 Transaksi manual disuntikkan: ${desc} (Rp ${amount.toLocaleString()})`);
      engine.log("MANUAL_INJECT", `Transaksi manual ditambahkan: ${desc} - ${cat} - Rp ${amount}`);
      document.getElementById("txDesc").value = "";
      document.getElementById("txAmount").value = "";
      renderAll();
    }
  });

  // Helper Toast Notification
  function showToast(message) {
    const existing = document.querySelector(".toast-notice");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast-notice";
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  // Initial Run
  engine.log("SYSTEM", "Prototype engine initialized.");
  renderAll();
});
