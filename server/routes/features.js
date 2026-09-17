/**
 * Features & Smart Bundles Routes
 * myBCA ADAPT
 * Mendukung Onboarding Flow & Penetapan Saldo Awal Fitur (Investasi, Auto-Save, Proteksi, dll.)
 */

const express = require('express');
const router = express.Router();
const { queryAll, queryOne, transaction } = require('../db/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { detectLifeEvent } = require('../engines/lifeEvent');
const { calcGamificationScore } = require('../engines/gamification');
const { FEATURE_PRODUCTS, getFeatureOnboardingDetails } = require('../services/featureCatalogProducts');
const { analyzeUserCashflow } = require('../services/cashflowCalculator');

/**
 * GET /api/features
 * Full 12-feature catalog with active status per persona
 */
router.get('/', optionalAuth, (req, res) => {
  const catalog = queryAll('SELECT * FROM features ORDER BY id ASC');
  const userFeatures = req.user ? queryAll(
    "SELECT feature_id FROM user_features WHERE user_id = ? AND status = 'ACTIVE'",
    [req.user.id]
  ) : [];
  const activeSet = new Set(userFeatures.map(f => f.feature_id));

  const data = catalog.map(f => ({
    ...f,
    is_active: activeSet.has(f.id)
  }));

  res.json({
    success: true,
    data
  });
});

/**
 * GET /api/features/:id/onboarding
 * Mengambil detail flow pendaftaran fitur, daftar produk investasi/opsi, dan saldo akun sumber
 * Dilengkapi AI Cashflow & Auto-Save Calculator (Anti-Meleset Engine)
 */
router.get('/:id/onboarding', requireAuth, (req, res) => {
  const featureId = req.params.id;

  const feature = queryOne('SELECT * FROM features WHERE id = ?', [featureId]);
  if (!feature) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'FEATURE_NOT_FOUND',
        message: `Fitur dengan ID '${featureId}' tidak ditemukan.`
      }
    });
  }

  // Cek status aktif
  const existing = queryOne(
    "SELECT * FROM user_features WHERE user_id = ? AND feature_id = ? AND status = 'ACTIVE'",
    [req.user.id, featureId]
  );

  // Ambil data rekening dan kalkulasi arus kas bulanan
  const account = queryOne('SELECT * FROM accounts WHERE user_id = ? LIMIT 1', [req.user.id]);
  const cashflow = analyzeUserCashflow(req.user.id);
  const onboardingDetails = { ...getFeatureOnboardingDetails(featureId) };

  // Khusus fitur Auto-Save, sesuaikan nominal preset dengan kalkulasi pengeluaran riil
  if (featureId === 'auto_save') {
    onboardingDetails.default_amount = cashflow.recommendations.optimal;
    onboardingDetails.amount_presets = [
      cashflow.recommendations.conservative,
      cashflow.recommendations.optimal,
      cashflow.recommendations.aggressive
    ];
    onboardingDetails.max_safe_limit = cashflow.recommendations.max_safe_limit;
  }

  res.json({
    success: true,
    data: {
      feature: {
        ...feature,
        is_active: !!existing
      },
      onboarding: onboardingDetails,
      cashflow_analysis: cashflow,
      source_account: account ? {
        account_id: account.id,
        account_no: account.account_no,
        account_type: account.account_type,
        currency: account.currency,
        balance: account.balance,
        formatted_balance: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(account.balance)
      } : null
    }
  });
});

/**
 * POST /api/features/:id/activate
 * Aktivasi fitur dengan dukungan penetapan saldo awal / modal investasi dan pendebetan rekening
 */
router.post('/:id/activate', requireAuth, (req, res) => {
  const featureId = req.params.id;
  const initialAmount = parseInt(req.body.initial_amount || req.body.amount || 0, 10);
  const productId = req.body.product_id || null;
  const productName = req.body.product_name || null;

  const feature = queryOne('SELECT * FROM features WHERE id = ?', [featureId]);
  if (!feature) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'FEATURE_NOT_FOUND',
        message: `Fitur dengan ID '${featureId}' tidak ditemukan.`
      }
    });
  }

  // Check if already active
  const existing = queryOne(
    "SELECT * FROM user_features WHERE user_id = ? AND feature_id = ? AND status = 'ACTIVE'",
    [req.user.id, featureId]
  );

  if (existing) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'FEATURE_ALREADY_ACTIVE',
        message: 'Fitur ini sudah aktif pada akun Anda.'
      }
    });
  }

  // Ambil rekening pengguna
  const account = queryOne('SELECT * FROM accounts WHERE user_id = ? LIMIT 1', [req.user.id]);
  if (!account) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Rekening pengguna tidak ditemukan.'
      }
    });
  }

  // Validasi saldo jika ada penetapan saldo awal
  if (initialAmount > 0) {
    if (account.balance < initialAmount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: `Saldo rekening Tahapan BCA Anda (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(account.balance)}) tidak mencukupi untuk penetapan saldo awal sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(initialAmount)}.`
        }
      });
    }
  }

  // Calculate previous score
  const catalog = queryAll('SELECT * FROM features');
  const prevUserFeatures = queryAll(
    "SELECT feature_id FROM user_features WHERE user_id = ? AND status = 'ACTIVE'",
    [req.user.id]
  );
  const prevActiveIds = prevUserFeatures.map(f => f.feature_id);
  const prevActiveFeatures = catalog.filter(f => prevActiveIds.includes(f.id));
  const prevGamification = calcGamificationScore(req.user, prevActiveFeatures);

  let updatedBalance = account.balance;
  let createdTx = null;
  const onboardingDetails = getFeatureOnboardingDetails(featureId);
  const txDate = new Date().toISOString().slice(0, 10);
  const refNumber = 'REF-BCA' + Date.now().toString().slice(-8) + Math.floor(100 + Math.random() * 900);

  // Jalankan transaksi database atomic
  transaction(db => {
    // 1. Catat status aktif fitur
    db.prepare(
      'INSERT INTO user_features (user_id, feature_id, status) VALUES (?, ?, ?)'
    ).run(req.user.id, featureId, 'ACTIVE');

    // 2. Jika ada penetapan saldo awal, debet rekening & buat histori mutasi
    if (initialAmount > 0) {
      updatedBalance = account.balance - initialAmount;
      
      db.prepare(
        'UPDATE accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(updatedBalance, account.id);

      const categoryName = onboardingDetails.category_db || 'Investasi & Deposito';
      const desc = productName 
        ? `${productName}` 
        : `Penempatan Awal ${feature.name}`;
      const icon = featureId.includes('invest') || featureId.includes('welma')
        ? 'bi-graph-up'
        : (featureId.includes('save') ? 'bi-piggy-bank' : 'bi-check-circle');

      const txInsert = db.prepare(`
        INSERT INTO transactions (account_id, user_id, date, category, amount, type, description, icon, period)
        VALUES (?, ?, ?, ?, ?, 'DB', ?, ?, 'current')
      `).run(account.id, req.user.id, txDate, categoryName, initialAmount, desc, icon);

      createdTx = {
        id: txInsert.lastInsertRowid,
        account_id: account.id,
        user_id: req.user.id,
        date: txDate,
        category: categoryName,
        amount: initialAmount,
        type: 'DB',
        description: desc,
        icon: icon,
        period: 'current'
      };
    }

    // 3. Catat audit log
    const logMsg = initialAmount > 0
      ? `Fitur diaktifkan: ${feature.name} (${productName || 'Produk Standar'}, Saldo Awal: Rp ${initialAmount.toLocaleString('id-ID')}, +${feature.points} PTS)`
      : `Fitur diaktifkan: ${feature.name} (+${feature.points} PTS)`;

    db.prepare(
      'INSERT INTO audit_logs (user_id, engine, message, payload) VALUES (?, ?, ?, ?)'
    ).run(
      req.user.id,
      'USER_ACTION',
      logMsg,
      JSON.stringify({
        feature_id: featureId,
        points: feature.points,
        product_id: productId,
        product_name: productName,
        initial_amount: initialAmount,
        ref_number: refNumber
      })
    );
  });

  // Calculate new score
  const newActiveIds = [...prevActiveIds, featureId];
  const newActiveFeatures = catalog.filter(f => newActiveIds.includes(f.id));
  const newGamification = calcGamificationScore(req.user, newActiveFeatures);

  const receipt = {
    reference_no: refNumber,
    timestamp: new Date().toISOString(),
    feature_name: feature.name,
    product_name: productName || feature.name,
    account_no: account.account_no,
    amount: initialAmount,
    formatted_amount: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(initialAmount),
    previous_balance: account.balance,
    new_balance: updatedBalance,
    points_awarded: feature.points,
    status: 'BERHASIL'
  };

  const payload = {
    feature_id: feature.id,
    name: feature.name,
    product_name: productName || feature.name,
    points_awarded: feature.points,
    initial_amount: initialAmount,
    new_balance: updatedBalance,
    transaction: createdTx,
    receipt: receipt,
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
