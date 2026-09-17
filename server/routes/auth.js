/**
 * Authentication & Persona Routes
 * myBCA ADAPT
 */

const express = require('express');
const router = express.Router();
const { queryOne, queryAll } = require('../db/database');
const { createSessionToken, removeSessionToken, requireAuth, resolveUser } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Authenticate with BCA ID and password
 */
router.post('/login', (req, res) => {
  const bcaId = (req.body.bca_id || req.body.username || '').toString().trim().toLowerCase();
  const password = (req.body.password || '').toString();

  if (!bcaId || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'BCA ID dan Password wajib diisi.'
      }
    });
  }

  // Check for dedicated Admin login
  if (['admin', 'admin2026', 'bcaadmin'].includes(bcaId)) {
    if (['admin123', 'admin123!', 'password123!', 'admin'].includes(password.toLowerCase())) {
      const token = createSessionToken('admin');
      const payload = {
        token,
        is_admin: true,
        user: {
          id: 'admin',
          bca_id: 'admin2026',
          name: 'Administrator myBCA (Product Manager)',
          email: 'admin.adapt@bca.co.id',
          age: 32,
          title: 'BCA Product Manager & Admin Quest',
          occupation: 'Digital Banking Specialist',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
          timeliness_rate: 100.0,
          savings_consistency: 1
        },
        account: {
          id: 'acc_admin',
          account_no: '8820000001',
          account_type: 'BCA Prioritas Admin',
          currency: 'IDR',
          balance: 500000000,
          status: 'ACTIVE'
        }
      };

      return res.json({
        success: true,
        ...payload,
        data: payload
      });
    }
  }

  const user = queryOne('SELECT * FROM users WHERE LOWER(bca_id) = ?', [bcaId]);
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'BCA ID atau Password salah. Silakan coba kembali.'
      }
    });
  }

  const account = queryOne('SELECT * FROM accounts WHERE user_id = ? LIMIT 1', [user.id]);
  const token = createSessionToken(user.id);

  const payload = {
    token,
    user: {
      id: user.id,
      bca_id: user.bca_id,
      name: user.name,
      email: user.email,
      age: user.age,
      title: user.title,
      occupation: user.occupation,
      avatar_url: user.avatar_url,
      timeliness_rate: user.timeliness_rate,
      savings_consistency: user.savings_consistency
    },
    account
  };

  res.json({
    success: true,
    ...payload,
    data: payload
  });
});

/**
 * POST /api/auth/quick-login
 * Judge 1-click persona quick-switcher
 */
router.post('/quick-login', (req, res) => {
  const personaId = (req.body.persona_id || req.body.personaId || '').toString().trim();

  if (!personaId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'persona_id wajib disertakan.'
      }
    });
  }

  if (personaId === 'admin') {
    const token = createSessionToken('admin');
    const payload = {
      token,
      is_admin: true,
      user: {
        id: 'admin',
        bca_id: 'admin2026',
        name: 'Administrator myBCA (Product Manager)',
        email: 'admin.adapt@bca.co.id',
        age: 32,
        title: 'BCA Product Manager & Admin Quest',
        occupation: 'Digital Banking Specialist',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        timeliness_rate: 100.0,
        savings_consistency: 1
      },
      account: {
        id: 'acc_admin',
        account_no: '8820000001',
        account_type: 'BCA Prioritas Admin',
        currency: 'IDR',
        balance: 500000000,
        status: 'ACTIVE'
      }
    };

    return res.json({
      success: true,
      ...payload,
      data: payload
    });
  }

  const user = queryOne('SELECT * FROM users WHERE id = ?', [personaId]);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Persona dengan ID '${personaId}' tidak ditemukan.`
      }
    });
  }

  const account = queryOne('SELECT * FROM accounts WHERE user_id = ? LIMIT 1', [user.id]);
  const token = createSessionToken(user.id);

  const payload = {
    token,
    user: {
      id: user.id,
      bca_id: user.bca_id,
      name: user.name,
      email: user.email,
      age: user.age,
      title: user.title,
      occupation: user.occupation,
      avatar_url: user.avatar_url,
      timeliness_rate: user.timeliness_rate,
      savings_consistency: user.savings_consistency
    },
    account
  };

  res.json({
    success: true,
    ...payload,
    data: payload
  });
});

/**
 * GET /api/auth/session
 * Get active session user
 */
router.get('/session', requireAuth, (req, res) => {
  const payload = {
    authenticated: true,
    user: req.user,
    account: req.account
  };

  res.json({
    success: true,
    ...payload,
    data: payload
  });
});

/**
 * POST /api/auth/logout
 * Terminate session
 */
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    removeSessionToken(authHeader.slice(7).trim());
  }
  res.json({
    success: true,
    data: {
      message: 'Sesi berhasil diakhiri. Kembali ke halaman login.'
    }
  });
});

module.exports = router;
