/**
 * Algoritma 1: Personalisasi Transaksi (Propensity Scoring Engine)
 * myBCA ADAPT
 *
 * Computes affinity match score per feature based on transaction frequency (60%)
 * and nominal spending volume (40%).
 */

const FEATURE_MAP = {
  auto_save: ['Gaji & Penghasilan', 'Uang Saku & Kiriman'],
  health_insurance: ['Gaji & Penghasilan', 'Hunian & Kos'],
  paylater_reminder: ['Cicilan & Paylater'],
  joint_account: ['Transfer Pasangan', 'Belanja Kebutuhan Pokok'],
  family_budgeting: ['Belanja Kebutuhan Pokok', 'Hunian & Kos'],
  family_insurance: ['Hunian & Kos', 'Transfer Pasangan'],
  child_savings: ['Belanja Kebutuhan Pokok', 'Tagihan & Utilitas'],
  qris_merchant: ['Pendapatan Usaha & QRIS', 'Operasional & Bisnis'],
  cashflow_report: ['Operasional & Bisnis', 'Pendapatan Usaha & QRIS'],
  student_savings: ['Pendidikan & Kuliah', 'Uang Saku & Kiriman'],
  conservative_invest: ['Investasi & Deposito'],
  welma_portfolio: ['Gaji & Penghasilan', 'Investasi & Deposito']
};

/**
 * Calculate propensity score for catalog features based on current transactions
 * @param {Array} catalog - List of all feature objects
 * @param {Array} transactions - Active account transactions
 * @param {Array} activeFeatureIds - Feature IDs already activated by user
 * @returns {Array} Sorted recommendations
 */
function calcPropensityScores(catalog, transactions = [], activeFeatureIds = []) {
  const catCounts = {};
  const catAmounts = {};
  let totalCount = 0;
  let maxAmount = 1;

  for (const t of transactions) {
    catCounts[t.category] = (catCounts[t.category] || 0) + 1;
    catAmounts[t.category] = (catAmounts[t.category] || 0) + Number(t.amount);
    totalCount++;
    if (catAmounts[t.category] > maxAmount) {
      maxAmount = catAmounts[t.category];
    }
  }

  const scores = [];

  for (const feat of catalog) {
    if (activeFeatureIds.includes(feat.id)) {
      continue; // Skip already active features
    }

    const targetCats = FEATURE_MAP[feat.id] || [];
    let scoreVal = 0;
    const matchedSignals = [];

    for (const cat of targetCats) {
      const count = catCounts[cat] || 0;
      const amt = catAmounts[cat] || 0;

      if (count > 0) {
        const freqNorm = count / Math.max(1, totalCount);
        const amtNorm = amt / maxAmount;
        const catScore = (freqNorm * 60) + (amtNorm * 40);
        scoreVal += catScore;
        matchedSignals.push(`${cat} (${count}x, Rp ${amt.toLocaleString('id-ID')})`);
      }
    }

    // Scale score to 0 - 99% range
    let finalScore = Math.min(99, Math.round(scoreVal * 1.8));
    if (finalScore < 15) {
      // Deterministic floor based on feature id hash to prevent random flutter
      const hash = feat.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      finalScore = 15 + (hash % 15);
    }

    let reason = 'Berdasarkan rekomendasi sistem AI myBCA';
    if (matchedSignals.length > 0) {
      reason = `Terdeteksi pola transaksi: ${matchedSignals.join(', ')}`;
    }

    scores.push({
      feature_id: feat.id,
      name: feat.name,
      category: feat.category,
      icon: feat.icon,
      points: feat.points,
      description: feat.description,
      score: finalScore,
      reason,
      signals: matchedSignals
    });
  }

  // Sort descending by score
  scores.sort((a, b) => b.score - a.score);
  return scores;
}

module.exports = {
  FEATURE_MAP,
  calcPropensityScores
};
