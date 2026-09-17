/**
 * Algoritma 2: Life Event Detection & Smart Bundling Engine
 * myBCA ADAPT
 *
 * Compares multi-period category shifts (baseline T-1 vs current T)
 * and detects major life stage milestones with confidence >= 60%.
 */

/**
 * Detect life event based on baseline and current transactions
 * @param {Array} baselineTransactions - T-1 transactions
 * @param {Array} currentTransactions - T transactions
 * @param {Array} rules - Life event rules from database
 * @returns {Object|null} Detected life event or null
 */
function detectLifeEvent(baselineTransactions = [], currentTransactions = [], rules = []) {
  const currCategories = new Set(currentTransactions.map(t => t.category));
  const baseCategories = new Set(baselineTransactions.map(t => t.category));

  let bestMatch = null;
  let highestConfidence = 0;

  for (const rule of rules) {
    const requiredSignals = typeof rule.required_signals === 'string'
      ? JSON.parse(rule.required_signals)
      : rule.required_signals;
    const optionalSignals = typeof rule.optional_signals === 'string'
      ? JSON.parse(rule.optional_signals)
      : rule.optional_signals;
    const featuresToBundle = typeof rule.features_to_bundle === 'string'
      ? JSON.parse(rule.features_to_bundle)
      : rule.features_to_bundle;

    let reqCount = 0;
    for (const sig of requiredSignals) {
      if (currCategories.has(sig)) {
        reqCount++;
      }
    }

    let optCount = 0;
    for (const sig of optionalSignals) {
      if (currCategories.has(sig)) {
        optCount++;
      }
    }

    // Hard gate: must have at least 1 required signal
    if (reqCount > 0) {
      const reqWeight = (reqCount / requiredSignals.length) * 75;
      const optWeight = (optCount / Math.max(1, optionalSignals.length)) * 25;
      const confidence = Math.round(reqWeight + optWeight);

      if (confidence >= 60 && confidence > highestConfidence) {
        highestConfidence = confidence;
        const matchedRequired = requiredSignals.filter(s => currCategories.has(s));
        const matchedOptional = optionalSignals.filter(s => currCategories.has(s));

        bestMatch = {
          rule_id: rule.id,
          name: rule.name,
          bundle_name: rule.bundle_name,
          confidence,
          description: rule.description,
          bonus_points: rule.bonus_points,
          features_to_bundle: featuresToBundle,
          detected_signals: [...matchedRequired, ...matchedOptional]
        };
      }
    }
  }

  return bestMatch;
}

module.exports = {
  detectLifeEvent
};
