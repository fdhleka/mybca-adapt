/**
 * Admin & Database Management Routes
 * myBCA ADAPT
 */

const express = require('express');
const router = express.Router();
const { queryOne, queryAll } = require('../db/database');
const { resetDatabase } = require('../db/seed');

/**
 * POST /api/admin/reset
 * 1-Click Database Reset to pristine seeds (< 50ms)
 */
router.post('/reset', (req, res) => {
  try {
    const startTime = Date.now();
    const resetResult = resetDatabase();
    const duration = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Database reset to initial seeds',
      duration_ms: duration,
      ...resetResult,
      data: resetResult
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: {
        code: 'RESET_FAILED',
        message: `Gagal mereset database: ${err.message}`
      }
    });
  }
});

/**
 * GET /api/admin/health
 * System & database health inspection
 */
router.get('/health', (req, res) => {
  try {
    const usersCount = queryOne('SELECT COUNT(*) as count FROM users')?.count || 0;
    const accountsCount = queryOne('SELECT COUNT(*) as count FROM accounts')?.count || 0;
    const txCount = queryOne('SELECT COUNT(*) as count FROM transactions')?.count || 0;
    const featuresCount = queryOne('SELECT COUNT(*) as count FROM features')?.count || 0;
    const userFeaturesCount = queryOne('SELECT COUNT(*) as count FROM user_features')?.count || 0;
    const vouchersCount = queryOne('SELECT COUNT(*) as count FROM vouchers')?.count || 0;
    const claimsCount = queryOne('SELECT COUNT(*) as count FROM user_vouchers')?.count || 0;

    res.json({
      status: 'UP',
      engine: 'SQLite 3 (node:sqlite DatabaseSync)',
      tables: {
        users: usersCount,
        accounts: accountsCount,
        transactions: txCount,
        features: featuresCount,
        user_features: userFeaturesCount,
        vouchers: vouchersCount,
        user_vouchers: claimsCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'DOWN',
      error: err.message
    });
  }
});

/**
 * GET /api/admin/vouchers
 * List all vouchers with claim metrics for Admin Portal
 */
router.get('/vouchers', (req, res) => {
  try {
    const vouchers = queryAll('SELECT * FROM vouchers ORDER BY created_at DESC');
    const claims = queryAll('SELECT voucher_id, COUNT(*) as claim_count FROM user_vouchers GROUP BY voucher_id');
    const claimMap = new Map();
    claims.forEach(c => claimMap.set(c.voucher_id, c.claim_count));

    const enriched = vouchers.map(v => ({
      ...v,
      claim_count: claimMap.get(v.id) || 0
    }));

    res.json({
      success: true,
      data: enriched,
      meta: {
        total: enriched.length,
        total_claims: claims.reduce((s, c) => s + c.claim_count, 0)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ADMIN_VOUCHER_FETCH_ERROR', message: err.message }
    });
  }
});

/**
 * POST /api/admin/vouchers
 * Create a new voucher with financial target quest
 */
router.post('/vouchers', (req, res) => {
  try {
    const {
      title,
      merchant,
      code,
      category = 'Shopping',
      icon = 'bi-gift',
      reward_value,
      reward_type = 'DISCOUNT',
      target_type,
      target_value,
      target_category = null,
      description,
      expiry_date = '2026-12-31'
    } = req.body;

    if (!title || !merchant || !reward_value || !target_type || target_value === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Kolom title, merchant, reward_value, target_type, dan target_value wajib diisi.'
        }
      });
    }

    const { execute } = require('../db/database');
    const cleanMerchant = merchant.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const voucherCode = (code || `BCA-${cleanMerchant}-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase().trim();
    const voucherId = `vouch_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const desc = description || `Dapatkan voucher ${merchant} senilai Rp ${Number(reward_value).toLocaleString('id-ID')} dengan menyelesaikan target finansial: ${target_type} (${target_value}).`;

    execute(
      `INSERT INTO vouchers (
        id, code, title, merchant, category, icon,
        reward_value, reward_type, target_type, target_value,
        target_category, description, expiry_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [
        voucherId,
        voucherCode,
        title.trim(),
        merchant.trim(),
        category,
        icon,
        Number(reward_value),
        reward_type,
        target_type,
        Number(target_value),
        target_category ? target_category.trim() : null,
        desc,
        expiry_date
      ]
    );

    const newVoucher = queryOne('SELECT * FROM vouchers WHERE id = ?', [voucherId]);

    execute(
      'INSERT INTO audit_logs (user_id, engine, message, payload) VALUES (?, ?, ?, ?)',
      [
        null,
        'ADMIN_VOUCHER_ENGINE',
        `Admin berhasil membuat voucher baru '${title}' [${voucherCode}] dengan target '${target_type}: ${target_value}'`,
        JSON.stringify(newVoucher)
      ]
    );

    res.status(201).json({
      success: true,
      message: `Voucher '${title}' berhasil dibuat dan langsung aktif untuk seluruh nasabah!`,
      data: newVoucher
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ADMIN_VOUCHER_CREATE_ERROR', message: err.message }
    });
  }
});

/**
 * DELETE /api/admin/vouchers/:id
 * Delete or deactivate voucher
 */
router.delete('/vouchers/:id', (req, res) => {
  try {
    const { execute } = require('../db/database');
    const voucherId = req.params.id;
    const existing = queryOne('SELECT * FROM vouchers WHERE id = ?', [voucherId]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Voucher tidak ditemukan.' }
      });
    }

    execute('DELETE FROM user_vouchers WHERE voucher_id = ?', [voucherId]);
    execute('DELETE FROM vouchers WHERE id = ?', [voucherId]);

    execute(
      'INSERT INTO audit_logs (user_id, engine, message, payload) VALUES (?, ?, ?, ?)',
      [
        null,
        'ADMIN_VOUCHER_ENGINE',
        `Admin menghapus voucher '${existing.title}' [${existing.code}]`,
        JSON.stringify({ voucher_id: voucherId })
      ]
    );

    res.json({
      success: true,
      message: `Voucher '${existing.title}' berhasil dihapus.`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ADMIN_VOUCHER_DELETE_ERROR', message: err.message }
    });
  }
});

module.exports = router;

