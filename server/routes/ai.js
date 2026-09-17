/**
 * AI Recalculation & Audit Inspector Routes
 * myBCA ADAPT
 * Terintegrasi dengan Groq AI Agent untuk Rekomendasi Fitur Cerdas & Klasifikasi Transaksi
 */

const express = require('express');
const router = express.Router();
const { queryAll, queryOne, execute } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { calcPropensityScores } = require('../engines/personalization');
const { detectLifeEvent } = require('../engines/lifeEvent');
const { calcGamificationScore } = require('../engines/gamification');
const { getGroqRecommendations } = require('../services/groqRecommender');

/**
 * Helper to compute full AI status from database (Synchronous Baseline)
 */
function evaluateAIForUser(user) {
  const currentTxs = queryAll(
    "SELECT * FROM transactions WHERE user_id = ? AND period = 'current' ORDER BY date DESC, id DESC",
    [user.id]
  );
  const baselineTxs = queryAll(
    "SELECT * FROM transactions WHERE user_id = ? AND period = 'baseline' ORDER BY date DESC, id DESC",
    [user.id]
  );
  const catalog = queryAll('SELECT * FROM features ORDER BY id ASC');
  const userFeatures = queryAll(
    "SELECT feature_id FROM user_features WHERE user_id = ? AND status = 'ACTIVE'",
    [user.id]
  );
  const activeIds = userFeatures.map(f => f.feature_id);
  const rules = queryAll('SELECT * FROM life_event_rules');

  const propensityRecs = calcPropensityScores(catalog, currentTxs, activeIds);
  const lifeEvent = detectLifeEvent(baselineTxs, currentTxs, rules);
  const activeFeatureObjs = catalog.filter(f => activeIds.includes(f.id));
  const gamification = calcGamificationScore(user, activeFeatureObjs);

  const lifeEventPayload = lifeEvent ? {
    detected: true,
    rule_id: lifeEvent.rule_id,
    event_type: lifeEvent.rule_id,
    bundle_name: lifeEvent.bundle_name,
    bundle_triggered: true,
    confidence: lifeEvent.confidence,
    description: lifeEvent.description,
    bonus_points: lifeEvent.bonus_points,
    features_to_bundle: lifeEvent.features_to_bundle,
    detected_signals: lifeEvent.detected_signals
  } : {
    detected: false,
    event_type: null,
    bundle_name: null,
    bundle_triggered: false,
    confidence: 0,
    detected_signals: []
  };

  return {
    user_id: user.id,
    propensity: propensityRecs,
    propensity_recommendations: propensityRecs,
    engine_source: 'mathematical_vector',
    life_event: lifeEventPayload,
    gamification: {
      score: gamification.score,
      tier: gamification.tier,
      badge_class: gamification.badge_class,
      reward_points: gamification.reward_points,
      next_tier_threshold: gamification.next_tier_threshold,
      breakdown: gamification.breakdown
    }
  };
}

/**
 * Asynchronous AI Evaluator with Groq AI Agent Enhancement
 */
async function evaluateAIForUserAsync(user) {
  const currentTxs = queryAll(
    "SELECT * FROM transactions WHERE user_id = ? AND period = 'current' ORDER BY date DESC, id DESC",
    [user.id]
  );
  const baselineTxs = queryAll(
    "SELECT * FROM transactions WHERE user_id = ? AND period = 'baseline' ORDER BY date DESC, id DESC",
    [user.id]
  );
  const catalog = queryAll('SELECT * FROM features ORDER BY id ASC');
  const userFeatures = queryAll(
    "SELECT feature_id FROM user_features WHERE user_id = ? AND status = 'ACTIVE'",
    [user.id]
  );
  const activeIds = userFeatures.map(f => f.feature_id);
  const account = queryOne('SELECT * FROM accounts WHERE user_id = ? LIMIT 1', [user.id]);
  const rules = queryAll('SELECT * FROM life_event_rules');

  // Baseline mathematical propensity
  const fallbackRecs = calcPropensityScores(catalog, currentTxs, activeIds);
  let finalRecs = fallbackRecs;
  let engineSource = 'mathematical_vector';

  // Panggil Groq AI Agent untuk rekomendasi cerdas dan kontekstual
  try {
    const groqRecs = await getGroqRecommendations(user, account, currentTxs, catalog, activeIds);
    if (groqRecs && groqRecs.length > 0) {
      finalRecs = groqRecs;
      engineSource = 'groq_ai';
    }
  } catch (err) {
    console.warn('[AI Evaluation] Groq recommendation fallback to mathematical engine:', err.message);
  }

  const lifeEvent = detectLifeEvent(baselineTxs, currentTxs, rules);
  const activeFeatureObjs = catalog.filter(f => activeIds.includes(f.id));
  const gamification = calcGamificationScore(user, activeFeatureObjs);

  const lifeEventPayload = lifeEvent ? {
    detected: true,
    rule_id: lifeEvent.rule_id,
    event_type: lifeEvent.rule_id,
    bundle_name: lifeEvent.bundle_name,
    bundle_triggered: true,
    confidence: lifeEvent.confidence,
    description: lifeEvent.description,
    bonus_points: lifeEvent.bonus_points,
    features_to_bundle: lifeEvent.features_to_bundle,
    detected_signals: lifeEvent.detected_signals
  } : {
    detected: false,
    event_type: null,
    bundle_name: null,
    bundle_triggered: false,
    confidence: 0,
    detected_signals: []
  };

  return {
    user_id: user.id,
    propensity: finalRecs,
    propensity_recommendations: finalRecs,
    engine_source: engineSource,
    ai_agent: {
      provider: 'Groq Cloud',
      model: 'allam-2-7b',
      status: engineSource === 'groq_ai' ? 'ACTIVE' : 'FALLBACK_READY'
    },
    life_event: lifeEventPayload,
    gamification: {
      score: gamification.score,
      tier: gamification.tier,
      badge_class: gamification.badge_class,
      reward_points: gamification.reward_points,
      next_tier_threshold: gamification.next_tier_threshold,
      breakdown: gamification.breakdown
    }
  };
}

/**
 * GET /api/ai/status & GET /api/ai/evaluation
 * Evaluates all 3 AI engines asynchronously with Groq AI Agent integration
 */
const handleAIStatus = async (req, res) => {
  try {
    const result = await evaluateAIForUserAsync(req.user);
    res.json({
      success: true,
      ...result,
      data: result
    });
  } catch (err) {
    const fallback = evaluateAIForUser(req.user);
    res.json({
      success: true,
      ...fallback,
      data: fallback
    });
  }
};

router.get('/status', requireAuth, handleAIStatus);
router.get('/evaluation', requireAuth, handleAIStatus);

/**
 * POST /api/ai/recalculate
 * Forces recalculation and writes trace entry
 */
router.post('/recalculate', requireAuth, async (req, res) => {
  let result;
  try {
    result = await evaluateAIForUserAsync(req.user);
  } catch {
    result = evaluateAIForUser(req.user);
  }

  execute(
    'INSERT INTO audit_logs (user_id, engine, message, payload) VALUES (?, ?, ?, ?)',
    [
      req.user.id,
      'GROQ_AI',
      `Kalkulasi ulang AI selesai untuk ${req.user.name}: Rekomendasi Top "${result.propensity[0]?.name}" (${result.engine_source})`,
      JSON.stringify({
        score: result.gamification.score,
        tier: result.gamification.tier,
        engine_source: result.engine_source,
        top_recommendation: result.propensity[0]?.name
      })
    ]
  );

  res.json({
    success: true,
    ...result,
    data: result
  });
});

/**
 * POST /api/ai/classify
 * Klasifikasi otomatis nama pengeluaran/pemasukan via Groq AI Agent
 */
router.post('/classify', async (req, res) => {
  const { description, desc } = req.body;
  const text = (description || desc || '').trim();

  if (!text) {
    return res.status(400).json({
      success: false,
      error: { code: 'EMPTY_TEXT', message: 'Teks transaksi tidak boleh kosong.' }
    });
  }

  try {
    const { classifyTransaction } = require('../services/groqClassifier');
    const classification = await classifyTransaction(text);

    res.json({
      success: true,
      data: classification,
      ...classification
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'CLASSIFY_FAILED', message: err.message }
    });
  }
});

/**
 * GET /api/ai/audit-logs
 * Live decision trace audit stream for Mode Juri Inspector
 */
router.get('/audit-logs', (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const logs = queryAll(
    'SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?',
    [limit]
  );

  res.json({
    success: true,
    data: logs
  });
});

module.exports = router;
