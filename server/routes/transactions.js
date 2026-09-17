/**
 * Transactions Routes
 * myBCA ADAPT
 */

const express = require('express');
const router = express.Router();
const { queryAll, queryOne, transaction } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { calcPropensityScores } = require('../engines/personalization');
const { detectLifeEvent } = require('../engines/lifeEvent');
const { calcGamificationScore } = require('../engines/gamification');

/**
 * Category to icon mapper helper
 */
function getCategoryIcon(category) {
  const map = {
    'Gaji & Penghasilan': 'bi-cash-stack',
    'Hunian & Kos': 'bi-house-door',
    'Cicilan & Paylater': 'bi-credit-card',
    'Belanja Kebutuhan Pokok': 'bi-cart3',
    'Jajan & Gaya Hidup': 'bi-cup-hot',
    'Tagihan & Utilitas': 'bi-lightning-charge',
    'Transfer Pasangan': 'bi-heart',
    'Pendapatan Usaha & QRIS': 'bi-qr-code',
    'Operasional & Bisnis': 'bi-truck',
    'Pendidikan & Kuliah': 'bi-book',
    'Uang Saku & Kiriman': 'bi-arrow-down-left',
    'Investasi & Deposito': 'bi-graph-up-arrow'
  };
  return map[category] || 'bi-receipt';
}

/**
 * GET /api/transactions
 * Retrieve transaction mutations for current persona
 */
router.get('/', requireAuth, (req, res) => {
  const period = (req.query.period || 'current').toLowerCase();
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  let sql = 'SELECT * FROM transactions WHERE user_id = ?';
  const params = [req.user.id];

  if (period === 'current' || period === 'baseline') {
    sql += ' AND period = ?';
    params.push(period);
  } else if (period !== 'all') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PERIOD',
        message: "Filter periode harus berupa 'current', 'baseline', atau 'all'."
      }
    });
  }

  sql += ' ORDER BY date DESC, id DESC LIMIT ?';
  params.push(limit);

  const transactions = queryAll(sql, params);

  res.json({
    success: true,
    data: transactions
  });
});

/**
 * POST /api/transactions/inject & POST /api/transactions
 * Injects a new transaction, updates balance atomically, and runs AI recalculation cascade
 */
const { classifyTransaction } = require('../services/groqClassifier');

const handleInject = async (req, res) => {
  const {
    description,
    desc,
    amount,
    date,
    icon
  } = req.body;

  const txDesc = (description || desc || '').trim();
  let txCat = (req.body.category || '').trim();
  const numAmount = parseInt(amount, 10);

  if (!txDesc) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Deskripsi transaksi wajib diisi.'
      }
    });
  }

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Nominal transaksi harus berupa bilangan bulat positif (> 0).'
      }
    });
  }

  // Auto-classify using Groq AI if category is not provided or set to 'AUTO'
  let aiClassified = false;
  let aiSource = 'manual';
  let txType = req.body.type ? req.body.type.toUpperCase() : null;

  if (!txCat || txCat.toUpperCase() === 'AUTO') {
    try {
      const classification = await classifyTransaction(txDesc);
      txCat = classification.category;
      if (!txType || (txType !== 'CR' && txType !== 'DB')) {
        txType = classification.type;
      }
      aiClassified = true;
      aiSource = classification.source;
    } catch {
      txCat = 'Pengeluaran Rumah';
    }
  }

  // Infer CR/DB type if not explicitly supplied
  if (!txType || (txType !== 'CR' && txType !== 'DB')) {
    if (
      txCat.includes('Masuk') ||
      txCat.includes('Gaji') ||
      txCat.includes('QRIS') ||
      txCat.includes('Terima')
    ) {
      txType = 'CR';
    } else {
      txType = 'DB';
    }
  }

  // Banking Integrity Guard:
  // Kategori belanja/pengeluaran tidak boleh menjadi CR kecuali ada kata kunci eksplisit uang masuk/refund
  const expenseCategoriesList = [
    'Belanja Kebutuhan Pokok',
    'Jajan & Gaya Hidup',
    'Hunian & Kos',
    'Cicilan & Paylater',
    'Tagihan & Utilitas',
    'Operasional & Bisnis',
    'Investasi & Deposito'
  ];

  if (expenseCategoriesList.includes(txCat)) {
    const lower = txDesc.toLowerCase();
    if (!lower.includes('refund') && !lower.includes('cashback') && !lower.includes('kembalian') && !lower.includes('uang masuk') && !lower.includes('transfer masuk')) {
      txType = 'DB';
    }
  }

  const txDate = date || new Date().toISOString().slice(0, 10);
  const txIcon = icon || getCategoryIcon(txCat);

  // Target account
  const account = req.account || queryOne('SELECT * FROM accounts WHERE user_id = ? LIMIT 1', [req.user.id]);
  if (!account) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Rekening pengguna tidak ditemukan.'
      }
    });
  }

  const delta = txType === 'CR' ? numAmount : -numAmount;

  // Execute atomic mutation transaction
  const result = transaction(db => {
    // 1. Insert transaction
    const insertStmt = db.prepare(
      'INSERT INTO transactions (account_id, user_id, date, category, amount, type, description, icon, period) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const runRes = insertStmt.run(
      account.id,
      req.user.id,
      txDate,
      txCat,
      numAmount,
      txType,
      txDesc,
      txIcon,
      'current'
    );

    const insertedId = runRes.lastInsertRowid;

    // 2. Update account balance
    db.prepare('UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      delta,
      account.id
    );

    // 3. Insert audit log
    db.prepare('INSERT INTO audit_logs (user_id, engine, message, payload) VALUES (?, ?, ?, ?)').run(
      req.user.id,
      'MANUAL_INJECT',
      `Transaksi disuntikkan: ${txDesc} (Rp ${numAmount.toLocaleString('id-ID')}, ${txType})`,
      JSON.stringify({ category: txCat, amount: numAmount, type: txType })
    );

    // 4. Fetch updated account
    const updatedAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account.id);
    const insertedTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(insertedId);

    return { updatedAccount, insertedTx };
  });

  // Execute AI Recalculation Pipeline
  const currentTxs = queryAll(
    "SELECT * FROM transactions WHERE user_id = ? AND period = 'current' ORDER BY date DESC, id DESC",
    [req.user.id]
  );
  const baselineTxs = queryAll(
    "SELECT * FROM transactions WHERE user_id = ? AND period = 'baseline' ORDER BY date DESC, id DESC",
    [req.user.id]
  );
  const catalog = queryAll('SELECT * FROM features ORDER BY id ASC');
  const userFeatures = queryAll(
    "SELECT feature_id FROM user_features WHERE user_id = ? AND status = 'ACTIVE'",
    [req.user.id]
  );
  const activeIds = userFeatures.map(f => f.feature_id);
  const rules = queryAll('SELECT * FROM life_event_rules');

  const propensityRecs = calcPropensityScores(catalog, currentTxs, activeIds);
  const detectedLifeEvent = detectLifeEvent(baselineTxs, currentTxs, rules);
  const activeFeatureObjects = catalog.filter(f => activeIds.includes(f.id));
  const gamification = calcGamificationScore(req.user, activeFeatureObjects);

  const aiEvaluation = {
    propensity_top_recommendation: propensityRecs[0] ? propensityRecs[0].name : null,
    propensity_top_score: propensityRecs[0] ? propensityRecs[0].score : null,
    life_event_detected: detectedLifeEvent ? detectedLifeEvent.rule_id : null,
    life_event_confidence: detectedLifeEvent ? detectedLifeEvent.confidence : 0,
    bundle_offered: detectedLifeEvent ? detectedLifeEvent.bundle_name : null,
    gamification_score: gamification.score,
    gamification_tier: gamification.tier
  };

  const payload = {
    transaction: result.insertedTx,
    new_balance: result.updatedAccount.balance,
    account: result.updatedAccount,
    ai_evaluation: aiEvaluation
  };

  res.status(201).json({
    success: true,
    ...payload,
    data: payload
  });
};

router.post('/inject', requireAuth, handleInject);
router.post('/', requireAuth, handleInject);

module.exports = router;
