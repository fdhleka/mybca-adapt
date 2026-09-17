/**
 * Accounts Routes
 * myBCA ADAPT
 */

const express = require('express');
const router = express.Router();
const { queryAll, queryOne } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/accounts/me
 * Active account details for current persona
 */
router.get('/me', requireAuth, (req, res) => {
  const account = queryOne(
    'SELECT * FROM accounts WHERE user_id = ? LIMIT 1',
    [req.user.id]
  );

  if (!account) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Tidak ada rekening aktif untuk persona ini.'
      }
    });
  }

  const payload = {
    ...account,
    account_number: account.account_no,
    holder_name: req.user.name
  };

  res.json({
    success: true,
    ...payload,
    data: payload
  });
});

/**
 * GET /api/accounts
 * All accounts for current persona
 */
router.get('/', requireAuth, (req, res) => {
  const accounts = queryAll(
    'SELECT * FROM accounts WHERE user_id = ? ORDER BY id ASC',
    [req.user.id]
  );

  res.json({
    success: true,
    data: accounts
  });
});

/**
 * GET /api/accounts/:id
 * Specific account details
 */
router.get('/:id', requireAuth, (req, res) => {
  const account = queryOne(
    'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );

  if (!account) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Rekening tidak ditemukan.'
      }
    });
  }

  res.json({
    success: true,
    data: account
  });
});

module.exports = router;
