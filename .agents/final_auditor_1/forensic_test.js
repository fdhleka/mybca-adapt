const { getDb, migrate, queryOne, queryAll, transaction, execute } = require('../../server/db/database');
const { calcPropensityScores } = require('../../server/engines/personalization');
const { detectLifeEvent } = require('../../server/engines/lifeEvent');
const { calcGamificationScore } = require('../../server/engines/gamification');
const assert = require('node:assert');

console.log('=== FORENSIC TEST 1: Direct SQLite Engine & Schema Inspection ===');
const db = getDb();
migrate(db);

const fk = queryOne('PRAGMA foreign_keys');
console.log('PRAGMA foreign_keys:', fk);
assert.strictEqual(fk.foreign_keys, 1);

const jm = queryOne('PRAGMA journal_mode');
console.log('PRAGMA journal_mode:', jm);
assert.strictEqual(jm.journal_mode.toLowerCase(), 'wal');

const tables = queryAll("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").map(t => t.name);
console.log('Detected DB Tables:', tables);
const requiredTables = ['users', 'accounts', 'features', 'user_features', 'transactions', 'life_event_rules', 'user_life_events', 'audit_logs', 'simulation_scenarios'];
for (const t of requiredTables) {
  assert(tables.includes(t), 'Missing table ' + t);
}

console.log('\n=== FORENSIC TEST 2: Transaction Rollback Integrity ===');
const beforeCount = queryOne('SELECT COUNT(*) as c FROM audit_logs').c;
try {
  transaction(conn => {
    conn.prepare('INSERT INTO audit_logs (engine, message) VALUES (?, ?)').run('TESTER', 'Should be rolled back');
    throw new Error('Forced error inside transaction');
  });
} catch (e) {
  console.log('Caught expected error:', e.message);
}
const afterCount = queryOne('SELECT COUNT(*) as c FROM audit_logs').c;
console.log('Rollback verification: before =', beforeCount, 'after =', afterCount);
assert.strictEqual(beforeCount, afterCount, 'Transaction must roll back completely on error!');

console.log('\n=== FORENSIC TEST 3: Dynamic Propensity Reactivity ===');
const catalog = queryAll('SELECT * FROM features');
const baseTxs = [{ category: 'Gaji Bulanan', amount: 10000000 }];
const score1 = calcPropensityScores(catalog, baseTxs, [])[0];
console.log('Top rec with 1 Gaji tx:', score1.name, 'score:', score1.score);
assert(score1.feature_id === 'auto_save' || score1.feature_id === 'health_insurance');

const multiWxs = [
  { category: 'Terima QRIS Merchant', amount: 50000000 },
  { category: 'Terima QRIS Merchant', amount: 50000000 },
  { category: 'Transfer Supplier', amount: 30000000 }
];
const score2 = calcPropensityScores(catalog, multiWxs, [])[0];
console.log('Top rec with Merchant txs:', score2.name, 'score:', score2.score);
assert.strictEqual(score2.feature_id, 'qris_merchant', 'Merchant transactions must promote qris_merchant as top score!');

console.log('\n=== FORENSIC TEST 4: Life Event Detection Threshold Math ===');
const rules = queryAll('SELECT * FROM life_event_rules');
// 0 signals
const le0 = detectLifeEvent([], [], rules);
assert.strictEqual(le0, null, 'No signals must yield null');

// Only optional signals (e.g. Supermarket / Dapur for NEWLYWED)
const leOpt = detectLifeEvent([], [{ category: 'Supermarket / Dapur' }], rules);
assert.strictEqual(leOpt, null, 'Optional signals without required must yield null');

// 1 required signal (75 * 1/2 = 37.5% -> below 60%)
const leReq1 = detectLifeEvent([], [{ category: 'Transfer Pasangan' }], rules);
assert.strictEqual(leReq1, null, '1 of 2 required signals (28%) must NOT trigger');

// 1 required (37.5%) + 1 optional (25%) = 62.5% -> rounds to 63% >= 60%; -> TRIGGER
const leReq1Opt = detectLifeEvent([], [
  { category: 'Transfer Pasangan' },
  { category: 'Supermarket / Dapur' }
], rules);
console.log('1 required + 1 optional confidence:', leReq1Opt?.confidence, 'bundle:', leReq1Opt?.bundle_name);
assert(leReq1Opt !== null, 'Confidence 63% >= 60% must trigger');
assert.strictEqual(leReq1Opt.confidence, 63);

// Both required (75%) -> TRIGGER
const leReqBoth = detectLifeEvent([], [
  { category: 'Transfer Pasangan' },
  { category: 'Cicilan KPR / Rumah' }
], rules);
console.log('Both required confidence:', leReqBoth?.confidence, 'bundle:', leReqBoth?.bundle_name);
assert.strictEqual(leReqBoth.confidence, 75);

console.log('\n=== FORENSIC TEST 5: Gamification Math & Clamping ===');
const mockUser = { id: 'test', timeliness_rate: 100.0, savings_consistency: 1 };
// Base (20) + Timeliness (15) + Savings (15) = 50
const g0 = calcGamificationScore(mockUser, []);
assert.strictEqual(g0.score, 50);
assert.strictEqual(g0.tier, 'Silver');

// Add 3 features (20 pts each = 60 pts) -> 50 + 60 = 110 -> CLAMP to 100
const gClamped = calcGamificationScore(mockUser, [
  { id: 'f1', points: 20 },
  { id: 'f2', points: 20 },
  { id: 'fi', points: 20 }
]);
console.log('Clamped score (50 + 60):', gClamped.score, 'tier:', gClamped.tier);
assert.strictEqual(gClamped.score, 100);
assert.strictEqual(gClamped.tier, 'Diamond');

console.log('\nALL FILE BASED FORENSIC TESTS PASSED!!!');
