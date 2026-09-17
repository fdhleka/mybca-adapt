/**
 * ENGINE ALGORITHMS - myBCA ADAPT
 * Implementation of all 3 Core Algorithms:
 * 1. Rule-Based Propensity Scoring (Personalized Recommendations)
 * 2. Multi-Period Pattern Shift Analysis (Life Event Detection & Smart Bundling)
 * 3. Weighted Financial Health Scoring (Gamification Engine)
 */

class MyBCAAdaptEngine {
  constructor(seedDb) {
    this.catalog = seedDb.features;
    this.logs = [];
  }

  log(engine, message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { timestamp, engine, message, data };
    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();
    console.log(`[${timestamp}] [${engine}] ${message}`, data || '');
  }

  /**
   * ALGORITMA 1: Personalisasi Transaksi (Propensity Scoring Engine)
   */
  calcPropensityScores(transactions, activeFeatures = []) {
    this.log("PROPENSITY_ENGINE", `Menganalisis ${transactions.length} data transaksi terkini...`);

    const catCounts = {};
    const catAmounts = {};
    let totalCount = 0;
    let maxAmount = 1;

    // 1. Group & sum by category
    transactions.forEach(t => {
      catCounts[t.category] = (catCounts[t.category] || 0) + 1;
      catAmounts[t.category] = (catAmounts[t.category] || 0) + t.amount;
      totalCount++;
      if (catAmounts[t.category] > maxAmount) maxAmount = catAmounts[t.category];
    });

    // 2. Map feature affinity per category (9 Consolidated Categories)
    const featureMap = {
      "auto_save": ["Gaji & Penghasilan"],
      "health_insurance": ["Gaji & Penghasilan", "Hunian & Kos"],
      "paylater_reminder": ["Cicilan & Paylater"],
      "joint_account": ["Transfer Pasangan", "Belanja Kebutuhan Pokok"],
      "family_budgeting": ["Belanja Kebutuhan Pokok", "Hunian & Kos"],
      "family_insurance": ["Hunian & Kos", "Transfer Pasangan"],
      "qris_merchant": ["Pendapatan Usaha & QRIS", "Operasional & Bisnis"],
      "cashflow_report": ["Operasional & Bisnis", "Pendapatan Usaha & QRIS"],
      "student_savings": ["Operasional & Bisnis", "Gaji & Penghasilan"],
      "conservative_invest": ["Investasi & Deposito"],
      "welma_portfolio": ["Gaji & Penghasilan", "Investasi & Deposito"]
    };

    const scores = [];

    Object.keys(this.catalog).forEach(featId => {
      if (activeFeatures.includes(featId)) return; // Skip already active features

      const feat = this.catalog[featId];
      const targetCats = featureMap[featId] || [];

      let scoreVal = 0;
      let matchedSignals = [];

      targetCats.forEach(cat => {
        const count = catCounts[cat] || 0;
        const amt = catAmounts[cat] || 0;

        if (count > 0) {
          const freqNorm = count / Math.max(1, totalCount);
          const amtNorm = amt / maxAmount;
          const CatScore = (freqNorm * 60) + (amtNorm * 40);
          scoreVal += CatScore;
          matchedSignals.push(`${cat} (${count}x, Rp ${amt.toLocaleString()})`);
        }
      });

      // Normalize score between 0 and 99%
      let finalScore = Math.min(99, Math.round(scoreVal * 1.8 + Math.random() * 5));
      if (finalScore < 15) finalScore = 15 + Math.floor(Math.random() * 20); // Base baseline

      let reason = "Berdasarkan rekomendasi sistem AI myBCA";
      if (matchedSignals.length > 0) {
        reason = `Terdeteksi pola transaksi: ${matchedSignals.join(', ')}`;
      }

      scores.push({
        feature: feat,
        score: finalScore,
        reason: reason,
        signals: matchedSignals
      });
    });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    this.log("PROPENSITY_ENGINE", `Kalkulasi selesai. Rekomendasi teratas: ${scores[0]?.feature.name} (${scores[0]?.score}%)`);
    return scores;
  }

  /**
   * ALGORITMA 2: Smart Bundling & Life Event Detection Engine
   */
  detectLifeEvent(baselineHistory, currentHistory) {
    this.log("LIFE_EVENT_ENGINE", `Membandingkan pola baseline (${baselineHistory.length} tx) vs periode berjalan (${currentHistory.length} tx)...`);

    const currCategories = new Set(currentHistory.map(t => t.category));
    const baseCategories = new Set(baselineHistory.map(t => t.category));

    // Life Event Signal Rules (9 Consolidated Categories)
    const rules = [
      {
        id: "FRESH_GRADUATE",
        name: "Mulai Kerja / Fresh Graduate",
        bundleName: "Mulai Kerja Kit",
        requiredSignals: ["Gaji & Penghasilan", "Hunian & Kos"],
        optionalSignals: ["Cicilan & Paylater", "Tagihan & Utilitas"],
        featuresToBundle: ["auto_save", "health_insurance"],
        bonusPoints: 25,
        desc: "Sistem mendeteksi masuknya Gaji Utama pertama & pembayaran Sewa Kos. Waktunya membangun fondasi finansial mandiri!"
      },
      {
        id: "NEWLYWED",
        name: "Rumah Tangga Baru",
        bundleName: "Rumah Tangga Baru Kit",
        requiredSignals: ["Transfer Pasangan", "Hunian & Kos"],
        optionalSignals: ["Belanja Kebutuhan Pokok"],
        featuresToBundle: ["joint_account", "family_budgeting", "family_insurance"],
        bonusPoints: 30,
        desc: "Sistem mendeteksi transfer rutin ke pasangan & cicilan KPR. Alokasikan dana bersama lebih transparan!"
      },
      {
        id: "BUSINESS_OWNER",
        name: "Pemilik Usaha (Merchant)",
        bundleName: "Pro Merchant Kit",
        requiredSignals: ["Pendapatan Usaha & QRIS", "Operasional & Bisnis"],
        optionalSignals: ["Tagihan & Utilitas"],
        featuresToBundle: ["qris_merchant", "cashflow_report"],
        bonusPoints: 25,
        desc: "Sistem mendeteksi transaksi penerimaan QRIS & biaya operasional bisnis berulang. Optimalkan arus kas usaha Anda!"
      },
      {
        id: "STUDENT",
        name: "Mahasiswa / Pelajar",
        bundleName: "Mahasiswa Starter Pack",
        requiredSignals: ["Operasional & Bisnis", "Gaji & Penghasilan"],
        optionalSignals: ["Jajan & Gaya Hidup"],
        featuresToBundle: ["student_savings"],
        bonusPoints: 15,
        desc: "Sistem mendeteksi transaksi rutin kampus dan kiriman orang tua. Kelola saku mingguan lebih hemat!"
      },
      {
        id: "PRE_RETIREMENT",
        name: "Persiapan Pensiun",
        bundleName: "Golden Age Retirement Kit",
        requiredSignals: ["Investasi & Deposito", "Belanja Kebutuhan Pokok"],
        optionalSignals: ["Tagihan & Utilitas"],
        featuresToBundle: ["conservative_invest", "welma_portfolio"],
        bonusPoints: 35,
        desc: "Sistem mendeteksi portofolio investasi stabil. Amankan dana masa depan dengan instrumen konservatif."
      }
    ];

    let bestMatch = null;
    let highestConfidence = 0;

    rules.forEach(rule => {
      let reqCount = 0;
      rule.requiredSignals.forEach(sig => {
        if (currCategories.has(sig)) reqCount++;
      });

      let optCount = 0;
      rule.optionalSignals.forEach(sig => {
        if (currCategories.has(sig)) optCount++;
      });

      if (reqCount > 0) {
        let confidence = (reqCount / rule.requiredSignals.length) * 75 + (optCount / Math.max(1, rule.optionalSignals.length)) * 25;
        confidence = Math.round(confidence);

        if (confidence > highestConfidence && confidence >= 60) {
          highestConfidence = confidence;
          bestMatch = {
            rule: rule,
            confidence: confidence,
            detectedSignals: rule.requiredSignals.filter(s => currCategories.has(s)).concat(rule.optionalSignals.filter(s => currCategories.has(s)))
          };
        }
      }
    });

    if (bestMatch) {
      this.log("LIFE_EVENT_ENGINE", `Life Event Terdeteksi: ${bestMatch.rule.name} (Confidence: ${bestMatch.confidence}%)`, bestMatch);
    } else {
      this.log("LIFE_EVENT_ENGINE", `Tidak ada Life Event baru dengan confidence >= 60%`);
    }

    return bestMatch;
  }

  /**
   * ALGORITMA 3: Weighted Gamification & Financial Health Score Engine
   */
  calcGamificationScore(persona) {
    this.log("GAMIFICATION_ENGINE", `Menghitung Skor Kesehatan Finansial untuk ${persona.name}...`);

    let baseScore = 20;
    let featurePoints = 0;
    let activeFeatureDetails = [];

    persona.activeFeatures.forEach(featId => {
      const feat = this.catalog[featId];
      if (feat) {
        featurePoints += feat.points;
        activeFeatureDetails.push({ name: feat.name, pts: feat.points });
      }
    });

    let timelinessBonus = persona.timelinessRate >= 95 ? 15 : 0;
    let savingsBonus = persona.savingsConsistency ? 15 : 0;

    let rawScore = baseScore + featurePoints + timelinessBonus + savingsBonus;
    let finalScore = Math.min(100, rawScore);

    // Determine Tier & Badge
    let tier = "Bronze";
    let badgeClass = "badge-bronze";
    let minScore = 0;
    let maxScore = 40;
    let rewardPoints = 250;

    if (finalScore >= 91) {
      tier = "Diamond";
      badgeClass = "badge-diamond";
      minScore = 91;
      maxScore = 100;
      rewardPoints = 5000;
    } else if (finalScore >= 71) {
      tier = "Gold";
      badgeClass = "badge-gold";
      minScore = 71;
      maxScore = 90;
      rewardPoints = 2500;
    } else if (finalScore >= 41) {
      tier = "Silver";
      badgeClass = "badge-silver";
      minScore = 41;
      maxScore = 70;
      rewardPoints = 1000;
    }

    const result = {
      score: finalScore,
      tier: tier,
      badgeClass: badgeClass,
      rewardPoints: rewardPoints,
      breakdown: {
        baseScore: baseScore,
        featurePoints: featurePoints,
        activeFeatures: activeFeatureDetails,
        timelinessBonus: timelinessBonus,
        savingsBonus: savingsBonus
      },
      nextTierThreshold: maxScore
    };

    this.log("GAMIFICATION_ENGINE", `Skor akhir: ${finalScore}/100 [Level ${tier}]`, result);
    return result;
  }
}
