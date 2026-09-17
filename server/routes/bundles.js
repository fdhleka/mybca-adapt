/**
 * Smart Bundles Routes
 * myBCA ADAPT
 */

const express = require('express');
const router = express.Router();
const { queryAll, queryOne, transaction } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { detectLifeEvent } = require('../engines/lifeEvent');
const { calcGamificationScore } = require('../engines/gamification');

/**
 * GET /api/bundles
 * Evaluates current transactions and returns detected smart bundle if confidence >= 60%
 */
router.get('/', requireAuth, (req, res) => {
  const currentTxs = queryAll(
    "SELECT * FROM transactions WHERE user_id = ? AND period = 'current' ORDER BY date DESC, id DESC",
    [req.user.id]
  );
  const baselineTxs = queryAll(
    "SELECT * FROM transactions WHERE user_id = ? AND period = 'baseline' ORDER BY date DESC, id DESC",
    [req.user.id]
  );
  const rules = queryAll('SELECT * FROM life_event_rules');
  const catalog = queryAll('SELECT * FROM features');

  const detected = detectLifeEvent(baselineTxs, currentTxs, rules);

  if (!detected) {
    return res.json({
      success: true,
      data: {
        detected: false,
        message: 'Tidak ada momen hidup baru yang terdeteksi dengan confidence >= 60%.'
      }
    });
  }

  const bundledFeatureObjs = catalog.filter(f => detected.features_to_bundle.includes(f.id));
  const pointsFromFeatures = bundledFeatureObjs.reduce((acc, f) => acc + f.points, 0);

  const payload = {
    detected: true,
    rule_id: detected.rule_id,
    bundle_name: detected.bundle_name,
    confidence: detected.confidence,
    description: detected.description,
    detected_signals: detected.detected_signals,
    features: bundledFeatureObjs,
    bonus_points: detected.bonus_points,
    total_points_gained: pointsFromFeatures + detected.bonus_points
  };

  res.json({
    success: true,
    ...payload,
    data: payload
  });
});

/**
 * POST /api/bundles/:id/activate
 * Batch claims all bundled features in 1-click
 */
router.post('/:id/activate', requireAuth, (req, res) => {
  const ruleId = req.params.id.toUpperCase();

  const rule = queryOne('SELECT * FROM life_event_rules WHERE UPPER(id) = ?', [ruleId]);
  if (!rule) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'BUNDLE_NOT_FOUND',
        message: `Paket Bundle '${ruleId}' tidak ditemukan.`
      }
    });
  }

  const featuresToBundle = typeof rule.features_to_bundle === 'string'
    ? JSON.parse(rule.features_to_bundle)
    : rule.features_to_bundle;

  const catalog = queryAll('SELECT * FROM features');
  const existingFeatures = queryAll(
    "SELECT feature_id FROM user_features WHERE user_id = ? AND status = 'ACTIVE'",
    [req.user.id]
  );
  const activeIds = new Set(existingFeatures.map(f => f.feature_id));
  const prevActiveFeatures = catalog.filter(f => activeIds.has(f.id));
  const prevGamification = calcGamificationScore(req.user, prevActiveFeatures);

  const newlyActivated = [];

  transaction(db => {
    const insertStmt = db.prepare(
      'INSERT INTO user_features (user_id, feature_id, status) VALUES (?, ?, ?)'
    );

    for (const fid of featuresToBundle) {
      if (!activeIds.has(fid)) {
        insertStmt.run(req.user.id, fid, 'ACTIVE');
        activeIds.add(fid);
        newlyActivated.push(fid);
      }
    }

    db.prepare(
      'INSERT INTO audit_logs (user_id, engine, message, payload) VALUES (?, ?, ?, ?)'
    ).run(
      req.user.id,
      'USER_ACTION',
      `Paket Bundle diaktifkan: ${rule.bundle_name} (${newlyActivated.length} fitur baru)`,
      JSON.stringify({ rule_id: rule.id, activated_features: newlyActivated, bonus_points: rule.bonus_points })
    );

    db.prepare(
      'INSERT INTO user_life_events (user_id, event_rule_id, confidence, detected_signals, status, activated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).run(
      req.user.id,
      rule.id,
      100,
      rule.required_signals,
      'ACTIVATED'
    );
  });

  const updatedActiveFeatures = catalog.filter(f => activeIds.has(f.id));
  const newGamification = calcGamificationScore(req.user, updatedActiveFeatures);

  const payload = {
    bundle_id: rule.id,
    bundle_name: rule.bundle_name,
    activated_features: newlyActivated,
    bonus_points_awarded: rule.bonus_points,
    new_score: newGamification.score,
    new_tier: newGamification.tier,
    gamification_score: {
      previous_score: prevGamification.score,
      new_score: newGamification.score,
      tier: newGamification.tier,
      reward_points: newGamification.reward_points
    }
  };

  res.json({
    success: true,
    ...payload,
    data: payload
  });
});

module.exports = router;
