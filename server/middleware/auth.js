/**
 * Authentication & Session Middleware
 * myBCA ADAPT
 */

const { queryOne } = require('../db/database');

// In-memory active session tokens store (token -> userId)
const activeSessions = new Map();

/**
 * Generate a token for a given user id
 */
function createSessionToken(userId) {
  const token = `token_${userId}_${Date.now()}`;
  activeSessions.set(token, {
    userId,
    createdAt: Date.now()
  });
  return token;
}

/**
 * Remove session token
 */
function removeSessionToken(token) {
  activeSessions.delete(token);
}

/**
 * Resolve user from token or fallback header
 */
function resolveUser(req) {
  let userId = null;

  // 1. Check Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (activeSessions.has(token)) {
        userId = activeSessions.get(token).userId;
      } else {
        // Provided token is either terminated, expired, or forged
        return null;
      }
    } else {
      // Malformed authorization header
      return null;
    }
  }

  // 2. Check custom x-persona-id header
  if (!userId && req.headers['x-persona-id']) {
    userId = req.headers['x-persona-id'];
  }

  // 3. Check query param persona_id or user_id
  if (!userId && (req.query.persona_id || req.query.user_id)) {
    userId = req.query.persona_id || req.query.user_id;
  }

  if (!userId) {
    return null;
  }

  if (userId === 'admin') {
    return {
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
    };
  }

  const user = queryOne('SELECT * FROM users WHERE id = ?', [userId]);
  return user || null;
}

/**
 * Express middleware requiring authenticated user
 */
function requireAuth(req, res, next) {
  const user = resolveUser(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Sesi tidak valid atau pengguna tidak ditemukan.'
      }
    });
  }

  const account = queryOne('SELECT * FROM accounts WHERE user_id = ? LIMIT 1', [user.id]);

  req.user = user;
  req.account = account;
  next();
}

/**
 * Optional auth middleware (does not fail if unauthenticated)
 */
function optionalAuth(req, res, next) {
  const user = resolveUser(req);
  if (user) {
    req.user = user;
    req.account = queryOne('SELECT * FROM accounts WHERE user_id = ? LIMIT 1', [user.id]);
  }
  next();
}

module.exports = {
  createSessionToken,
  removeSessionToken,
  resolveUser,
  requireAuth,
  optionalAuth
};
