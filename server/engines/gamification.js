/**
 * Algoritma 3: Financial Health Gamification Score Engine
 * myBCA ADAPT
 *
 * Dynamic 0-100 weighted score:
 * Base 20 PTS + Active Feature Points + Timeliness Bonus (15 PTS) + Savings Bonus (15 PTS)
 * Mapped to Bronze (0-40), Silver (41-70), Gold (71-90), Diamond (91-100).
 */

/**
 * Calculate financial health score and achievement tier
 * @param {Object} user - User profile object
 * @param {Array} activeFeatures - List of active feature objects with points
 * @returns {Object} Gamification metrics
 */
function calcGamificationScore(user, activeFeatures = []) {
  const baseScore = 20;
  let featurePoints = 0;
  const activeFeatureDetails = [];

  for (const feat of activeFeatures) {
    const pts = Number(feat.points || 0);
    featurePoints += pts;
    activeFeatureDetails.push({
      id: feat.id,
      name: feat.name,
      points: pts
    });
  }

  const timelinessBonus = Number(user.timeliness_rate) >= 95.0 ? 15 : 0;
  const savingsBonus = Number(user.savings_consistency) === 1 ? 15 : 0;

  const rawScore = baseScore + featurePoints + timelinessBonus + savingsBonus;
  const finalScore = Math.min(100, Math.max(0, rawScore));

  let tier = 'Bronze';
  let badgeClass = 'badge-bronze';
  let nextThreshold = 40;
  let rewardPoints = 250;

  if (finalScore >= 91) {
    tier = 'Diamond';
    badgeClass = 'badge-diamond';
    nextThreshold = 100;
    rewardPoints = 5000;
  } else if (finalScore >= 71) {
    tier = 'Gold';
    badgeClass = 'badge-gold';
    nextThreshold = 90;
    rewardPoints = 2500;
  } else if (finalScore >= 41) {
    tier = 'Silver';
    badgeClass = 'badge-silver';
    nextThreshold = 70;
    rewardPoints = 1000;
  }

  return {
    score: finalScore,
    raw_score: rawScore,
    tier,
    badge_class: badgeClass,
    reward_points: rewardPoints,
    next_tier_threshold: nextThreshold,
    breakdown: {
      base_score: baseScore,
      feature_points: featurePoints,
      active_features: activeFeatureDetails,
      timeliness_bonus: timelinessBonus,
      savings_bonus: savingsBonus
    }
  };
}

module.exports = {
  calcGamificationScore
};
