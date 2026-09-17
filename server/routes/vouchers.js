/**
 * User Voucher & Financial Quests Routes
 * myBCA ADAPT
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { evaluateVouchersForUser, claimVoucher } = require('../services/voucherEvaluator');
const { queryOne } = require('../db/database');

/**
 * GET /api/vouchers
 * Get all available vouchers with live target progress for the authenticated persona
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const vouchers = evaluateVouchersForUser(req.user.id);
    const claimedCount = vouchers.filter(v => v.is_claimed).length;
    const readyToClaimCount = vouchers.filter(v => v.is_unlocked && !v.is_claimed).length;

    res.json({
      success: true,
      data: vouchers,
      meta: {
        total: vouchers.length,
        claimed_count: claimedCount,
        ready_to_claim_count: readyToClaimCount,
        user_id: req.user.id,
        user_name: req.user.name
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'VOUCHER_FETCH_ERROR', message: err.message }
    });
  }
});

/**
 * POST /api/vouchers/claim/:id
 * Claim an unlocked voucher
 */
router.post('/claim/:id', requireAuth, (req, res) => {
  try {
    const voucherId = req.params.id;
    const result = claimVoucher(req.user.id, voucherId);

    res.json({
      success: true,
      message: `Selamat! Voucher '${result.voucher.title}' berhasil kamu klaim. Gunakan kode: ${result.voucher.code}`,
      data: result.voucher
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: 'CLAIM_FAILED', message: err.message }
    });
  }
});

/**
 * GET /api/vouchers/:id
 * Get single voucher details
 */
router.get('/:id', requireAuth, (req, res) => {
  try {
    const vouchers = evaluateVouchersForUser(req.user.id);
    const voucher = vouchers.find(v => v.id === req.params.id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Voucher tidak ditemukan.' }
      });
    }

    res.json({
      success: true,
      data: voucher
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'VOUCHER_DETAIL_ERROR', message: err.message }
    });
  }
});

module.exports = router;
