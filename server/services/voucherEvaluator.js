/**
 * Voucher & Financial Target Evaluator Engine
 * myBCA ADAPT
 * Menghitung live progress target finansial per nasabah & validasi klaim voucher
 */

const { queryAll, queryOne, execute } = require('../db/database');
const { calcGamificationScore } = require('../engines/gamification');

/**
 * Calculate user's live progress against a specific voucher target
 * @param {Object} user 
 * @param {Object} voucher 
 * @param {Array} transactions 
 * @param {Array} activeFeatureObjs 
 * @param {Object} gamification 
 * @returns {Object} { currentValue, targetValue, percent, progressLabel, isUnlocked }
 */
function calculateTargetProgress(user, voucher, transactions, activeFeatureObjs, gamification) {
  let currentValue = 0;
  const targetValue = voucher.target_value;
  let progressLabel = '';

  switch (voucher.target_type) {
    case 'MIN_HEALTH_SCORE': {
      currentValue = gamification ? gamification.score : 0;
      progressLabel = `${currentValue} / ${targetValue} PTS`;
      break;
    }

    case 'CATEGORY_TX_COUNT': {
      const targetCat = (voucher.target_category || '').toLowerCase().trim();
      const matchingTxs = transactions.filter(tx => {
        const cat = (tx.category || '').toLowerCase().trim();
        return !targetCat || cat.includes(targetCat) || targetCat.includes(cat);
      });
      currentValue = matchingTxs.length;
      progressLabel = `${currentValue} / ${targetValue} Transaksi`;
      break;
    }

    case 'MIN_SAVINGS_ALLOC': {
      const savingsTxs = transactions.filter(tx => {
        const cat = (tx.category || '').toLowerCase().trim();
        const desc = (tx.description || '').toLowerCase().trim();
        return (
          cat.includes('investasi') ||
          cat.includes('tabungan') ||
          cat.includes('auto-save') ||
          desc.includes('investasi') ||
          desc.includes('tabungan') ||
          desc.includes('auto-save') ||
          desc.includes('reksa dana')
        );
      });
      const txSavingsSum = savingsTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      const hasSavingsFeat = activeFeatureObjs.some(f => 
        f.id === 'auto_save' || f.id === 'welma_portfolio' || f.id === 'conservative_invest' || f.id === 'child_savings'
      );
      
      currentValue = txSavingsSum > 0 ? txSavingsSum : (hasSavingsFeat ? Math.min(targetValue, 500000) : 0);
      progressLabel = `Rp ${currentValue.toLocaleString('id-ID')} / Rp ${targetValue.toLocaleString('id-ID')}`;
      break;
    }

    case 'ACTIVE_FEATURE_COUNT': {
      currentValue = activeFeatureObjs.length;
      progressLabel = `${currentValue} / ${targetValue} Fitur Aktif`;
      break;
    }

    case 'TOTAL_TX_COUNT': {
      currentValue = transactions.length;
      progressLabel = `${currentValue} / ${targetValue} Transaksi`;
      break;
    }

    case 'MIN_SPEND_AMOUNT': {
      const debits = transactions.filter(t => t.type === 'DB');
      currentValue = debits.reduce((sum, t) => sum + (t.amount || 0), 0);
      progressLabel = `Rp ${currentValue.toLocaleString('id-ID')} / Rp ${targetValue.toLocaleString('id-ID')}`;
      break;
    }

    default: {
      currentValue = 0;
      progressLabel = `0 / ${targetValue}`;
    }
  }

  const percent = targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 100;
  const isUnlocked = currentValue >= targetValue;

  return {
    currentValue,
    targetValue,
    percent,
    progressLabel,
    isUnlocked
  };
}

/**
 * Get all vouchers with live user progress
 * @param {string} userId
 * @returns {Array} List of vouchers with calculated progress and claim state
 */
function evaluateVouchersForUser(userId) {
  const user = queryOne('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) {
    throw new Error(`Nasabah dengan ID '${userId}' tidak ditemukan.`);
  }

  const transactions = queryAll(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC',
    [userId]
  );

  const userFeats = queryAll(
    "SELECT feature_id FROM user_features WHERE user_id = ? AND status = 'ACTIVE'",
    [userId]
  );
  const activeIds = userFeats.map(f => f.feature_id);
  const allFeatures = queryAll('SELECT * FROM features');
  const activeFeatureObjs = allFeatures.filter(f => activeIds.includes(f.id));

  const gamification = calcGamificationScore(user, activeFeatureObjs);

  const userClaims = queryAll(
    'SELECT * FROM user_vouchers WHERE user_id = ?',
    [userId]
  );
  const claimsMap = new Map();
  userClaims.forEach(c => claimsMap.set(c.voucher_id, c));

  const vouchers = queryAll(
    "SELECT * FROM vouchers WHERE status = 'ACTIVE' ORDER BY created_at DESC"
  );

  return vouchers.map(v => {
    const claim = claimsMap.get(v.id);
    const progress = calculateTargetProgress(user, v, transactions, activeFeatureObjs, gamification);

    return {
      id: v.id,
      code: v.code,
      title: v.title,
      merchant: v.merchant,
      category: v.category,
      icon: v.icon,
      reward_value: v.reward_value,
      reward_type: v.reward_type,
      target_type: v.target_type,
      target_value: v.target_value,
      target_category: v.target_category,
      description: v.description,
      expiry_date: v.expiry_date,
      status: v.status,
      created_at: v.created_at,
      current_value: progress.currentValue,
      progress_percent: progress.percent,
      progress_label: progress.progressLabel,
      is_unlocked: progress.isUnlocked,
      is_claimed: Boolean(claim),
      claimed_at: claim ? claim.claimed_at : null,
      user_voucher_status: claim ? claim.status : null
    };
  });
}

/**
 * Claim an unlocked voucher for a user
 * @param {string} userId 
 * @param {string} voucherId 
 * @returns {Object} Claim result with voucher and timestamp
 */
function claimVoucher(userId, voucherId) {
  const user = queryOne('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) {
    throw new Error('User tidak ditemukan.');
  }

  const voucher = queryOne("SELECT * FROM vouchers WHERE id = ? AND status = 'ACTIVE'", [voucherId]);
  if (!voucher) {
    throw new Error('Voucher tidak ditemukan atau sudah tidak aktif.');
  }

  const existingClaim = queryOne(
    'SELECT * FROM user_vouchers WHERE user_id = ? AND voucher_id = ?',
    [userId, voucherId]
  );
  if (existingClaim) {
    throw new Error('Voucher ini sudah pernah kamu klaim!');
  }

  const userVouchers = evaluateVouchersForUser(userId);
  const evalVoucher = userVouchers.find(v => v.id === voucherId);
  if (!evalVoucher || !evalVoucher.is_unlocked) {
    throw new Error(`Target finansial belum tercapai (${evalVoucher ? evalVoucher.progress_label : '0%'}). Selesaikan target misi terlebih dahulu!`);
  }

  execute(
    "INSERT INTO user_vouchers (user_id, voucher_id, status, claimed_at) VALUES (?, ?, 'CLAIMED', CURRENT_TIMESTAMP)",
    [userId, voucherId]
  );

  const claimRecord = queryOne(
    'SELECT * FROM user_vouchers WHERE user_id = ? AND voucher_id = ?',
    [userId, voucherId]
  );

  execute(
    'INSERT INTO audit_logs (user_id, engine, message, payload) VALUES (?, ?, ?, ?)',
    [
      userId,
      'VOUCHER_ENGINE',
      `User ${user.name} (${userId}) berhasil mengklaim voucher '${voucher.title}' [${voucher.code}]`,
      JSON.stringify({ voucher_id: voucher.id, code: voucher.code, reward_value: voucher.reward_value })
    ]
  );

  return {
    success: true,
    voucher: {
      ...voucher,
      claimed_at: claimRecord.claimed_at,
      status: 'CLAIMED'
    }
  };
}

module.exports = {
  calculateTargetProgress,
  evaluateVouchersForUser,
  claimVoucher
};
