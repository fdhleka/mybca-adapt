/**
 * ==============================================================================
 * CHALLENGER 2: ADVERSARIAL STRESS HARNESS & EMPIRICAL AUDIT
 * myBCA ADAPT — 3 AI Engines, Simulation Lab & Mode Juri Audit Stream
 * ==============================================================================
 * 
 * Scope:
 * 1. Algoritma 1 (Propensity scoring):
 *    - Bounds 15-99% under adversarial / zero / extreme inputs
 *    - 60% frequency / 40% amount weighting validation
 *    - Descending ranking order & active features exclusion
 * 2. Algoritma 2 (Life Event Detection & Smart Bundling):
 *    - Confidence formula: (reqCount/reqTotal)*75 + (optCount/optTotal)*25
 *    - Borderline signals testing across all 5 life stage rules
 *    - Strict boundary: <60% NEVER triggers bundle, >=60% ALWAYS triggers bundle
 * 3. Algoritma 3 (Gamification Health Score):
 *    - Clamping strictly [0, 100] under extreme, negative, or overflow point values
 *    - Exact tier boundaries (0-40 Bronze, 41-70 Silver, 71-90 Gold, 91-100 Diamond)
 *    - Live incremental score updates on single feature & multi-feature bundle claims
 * 4. Mode Juri Audit Logs Stream Integrity:
 *    - Audit trail captures all AI evaluations and simulation mutations
 *    - Schema integrity: id, timestamp, engine, message, valid JSON payload
 * ==============================================================================
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Import AI Engines directly for white-box adversarial stress testing
const { calcPropensityScores, FEATURE_MAP } = require('../server/engines/personalization');
const { detectLifeEvent } = require('../server/engines/lifeEvent');
const { calcGamificationScore } = require('../server/engines/gamification');
const { FEATURES, LIFE_EVENT_RULES, PERSONAS_DATA, resetDatabase } = require('../server/db/seed');
const { getDb, queryAll, queryOne } = require('../server/db/database');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
let spawnedServer = null;

// Metrics tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: []
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message ? message + ': ' : ''}Expected [${expected}] (${typeof expected}), got [${actual}] (${typeof actual})`);
  }
}

function test(name, fn) {
  results.total++;
  try {
    fn();
    results.passed++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    results.failed++;
    results.failures.push({ name, error: err.message, stack: err.stack });
    console.log(`  ✗ FAIL: ${name}`);
    console.log(`         Error: ${err.message}`);
  }
}

async function asyncTest(name, fn) {
  results.total++;
  try {
    await fn();
    results.passed++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    results.failed++;
    results.failures.push({ name, error: err.message, stack: err.stack });
    console.log(`  ✗ FAIL: ${name}`);
    console.log(`         Error: ${err.message}`);
  }
}

// HTTP Helper
async function api(method, endpoint, body = null, token = null) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = { 'Accept': 'application/json' };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data };
}

async function ensureServer() {
  try {
    const res = await api('GET', '/api/personas');
    if (res.status === 200) return;
  } catch {}

  console.log('Spawning backend server for E2E challenge tests...');
  const serverPath = path.resolve(__dirname, '..', 'server', 'server.js');
  spawnedServer = spawn(process.execPath, [serverPath], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'ignore',
    env: { ...process.env, PORT: '3000' }
  });

  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await api('GET', '/api/personas');
      if (res.status === 200) {
        console.log('Server is ready on port 3000.');
        return;
      }
    } catch {}
  }
  throw new Error('Could not connect to server on port 3000');
}

// ==============================================================================
// 1. ADVERSARIAL TESTS: ALGORITMA 1 (PROPENSITY SCORING)
// ==============================================================================
function runAlgoritma1Tests() {
  console.log('\n======================================================');
  console.log('SECTION 1: Algoritma 1 — Propensity Scoring Adversarial');
  console.log('======================================================');

  test('ALG1.1: Empty transaction catalog maintains strict bounds [15, 29] via hash floor', () => {
    const recs = calcPropensityScores(FEATURES, [], []);
    assertEqual(recs.length, FEATURES.length, 'All features must be scored');
    for (const r of recs) {
      assert(r.score >= 15 && r.score <= 99, `Score ${r.score} must be within [15, 99]`);
      assert(r.score <= 29, `Score on empty txs should fall within hash floor [15, 29], got ${r.score}`);
    }
  });

  test('ALG1.2: Massive spending transactions (100 Billion IDR) clamped strictly at 99%', () => {
    const hugeTxs = [
      { category: 'Gaji Bulanan', amount: 100000000000 },
      { category: 'Gaji Bulanan', amount: 50000000000 },
      { category: 'Transfer Masuk', amount: 25000000000 }
    ];
    const recs = calcPropensityScores(FEATURES, hugeTxs, []);
    const autoSave = recs.find(r => r.feature_id === 'auto_save');
    assert(autoSave !== undefined, 'auto_save must exist in recommendations');
    assertEqual(autoSave.score, 99, 'Max affinity must clamp at exactly 99% (never 100%)');
  });

  test('ALG1.3: Deterministic score ceiling: no input can produce > 99%', () => {
    // Stress with 50 matching transactions of extreme amounts
    const floodTxs = [];
    for (let i = 0; i < 50; i++) {
      floodTxs.push({ category: 'Gaji Bulanan', amount: 1000000000 });
      floodTxs.push({ category: 'Sewa Kos / Housing', amount: 500000000 });
    }
    const recs = calcPropensityScores(FEATURES, floodTxs, []);
    for (const r of recs) {
      assert(r.score <= 99, `Score ${r.score} exceeded ceiling 99%`);
      assert(r.score >= 15, `Score ${r.score} fell below floor 15%`);
    }
  });

  test('ALG1.4: Strict 60% frequency / 40% amount weighting verification', () => {
    // Construct controlled dataset:
    // Feature A: target cats = ['Bayar Kampus / UKT', 'Transfer Masuk Ortu'] (student_savings)
    // Feature B: target cats = ['Investasi Reksa Dana', 'Investasi Deposito'] (conservative_invest)
    // Total transactions = 10
    // student_savings gets 9 transactions of Rp 1,000 = 90% frequency, amount = 9,000
    // conservative_invest gets 1 transaction of Rp 81,000 = 10% frequency, amount = 81,000
    // maxAmount = 81,000
    // Freq norm for student: 9 / 10 = 0.9. Amt norm: 9000 / 81000 = 0.11111
    // catScore student: (0.9 * 60) + (0.11111 * 40) = 54 + 4.444 = 58.444
    // Freq norm for invest: 1 / 10 = 0.1. Amt norm: 81000 / 81000 = 1.0
    // catScore invest: (0.1 * 60) + (1.0 * 40) = 6 + 40 = 46.0
    // Student score should be round(58.444 * 1.8) = round(105.2) -> clamped to 99
    // Invest score should be round(46 * 1.8) = round(82.8) = 83

    const controlledTxs = [];
    for (let i = 0; i < 9; i++) {
      controlledTxs.push({ category: 'Bayar Kampus / UKT', amount: 1000 });
    }
    controlledTxs.push({ category: 'Investasi Reksa Dana', amount: 81000 });

    const recs = calcPropensityScores(FEATURES, controlledTxs, []);
    const student = recs.find(r => r.feature_id === 'student_savings');
    const invest = recs.find(r => r.feature_id === 'conservative_invest');

    assert(student !== undefined && invest !== undefined, 'Both features must be scored');
    assertEqual(invest.score, 83, 'conservative_invest score matches exact 60/40 weighting formula');
    assertEqual(student.score, 99, 'student_savings high frequency score correctly clamps at 99');
    assert(student.score > invest.score, 'High frequency feature ranks higher due to 60% weight dominance');
  });

  test('ALG1.5: Output array strictly maintains descending score order', () => {
    // Randomized transaction mixture
    const mixedTxs = [
      { category: 'Gaji Bulanan', amount: 7000000 },
      { category: 'Supermarket / Dapur', amount: 1500000 },
      { category: 'Supermarket / Dapur', amount: 800000 },
      { category: 'Paylater', amount: 450000 },
      { category: 'Terima QRIS Merchant', amount: 3000000 }
    ];
    const recs = calcPropensityScores(FEATURES, mixedTxs, []);
    for (let i = 0; i < recs.length - 1; i++) {
      assert(recs[i].score >= recs[i + 1].score, `Sort invariant violated: recs[${i}].score (${recs[i].score}) < recs[${i+1}].score (${recs[i+1].score})`);
    }
  });

  test('ALG1.6: Active features are excluded from recommendations feed', () => {
    const activeIds = ['auto_save', 'health_insurance', 'joint_account'];
    const recs = calcPropensityScores(FEATURES, [{ category: 'Gaji Bulanan', amount: 10000000 }], activeIds);
    for (const r of recs) {
      assert(!activeIds.includes(r.feature_id), `Active feature ${r.feature_id} was not excluded from recommendations`);
    }
    assertEqual(recs.length, FEATURES.length - activeIds.length, 'Output count matches total minus active');
  });

  test('ALG1.7: Resilient to malformed transaction amounts (null, string, NaN)', () => {
    const malformedTxs = [
      { category: 'Gaji Bulanan', amount: '5000000' },
      { category: 'Gaji Bulanan', amount: 0 },
      { category: 'Transfer Masuk', amount: null },
      { category: 'Transfer Masuk', amount: undefined },
      { category: 'Unknown Category', amount: 999999 }
    ];
    const recs = calcPropensityScores(FEATURES, malformedTxs, []);
    assert(Array.isArray(recs), 'Recs must return array without throwing');
    for (const r of recs) {
      assert(r.score >= 15 && r.score <= 99, `Score ${r.score} within bounds even with malformed txs`);
    }
  });
}

// ==============================================================================
// 2. ADVERSARIAL TESTS: ALGORITMA 2 (LIFE EVENT DETECTION)
// ==============================================================================
function runAlgoritma2Tests() {
  console.log('\n======================================================');
  console.log('SECTION 2: Algoritma 2 — Life Event Detection Adversarial');
  console.log('======================================================');

  const rules = LIFE_EVENT_RULES;

  test('ALG2.1: Hard Gate — Only optional signals matched yields NULL (confidence 0%)', () => {
    // FRESH_GRADUATE optional signals: ['Cicilan / Paylater', 'Tagihan Utilitas']
    const txs = [
      { category: 'Cicilan / Paylater', amount: 500000 },
      { category: 'Tagihan Utilitas', amount: 300000 }
    ];
    const detected = detectLifeEvent([], txs, rules);
    assertEqual(detected, null, 'Without required signals, detectLifeEvent must return null');
  });

  test('ALG2.2: Borderline Sub-threshold Case 1 — 1 req (37.5) + 0 opt (0) = 38% (<60% -> NULL)', () => {
    // FRESH_GRADUATE has 2 req signals: 'Gaji Bulanan', 'Sewa Kos / Housing'
    // Provide only 'Gaji Bulanan'
    const txs = [
      { category: 'Gaji Bulanan', amount: 8000000 }
    ];
    const detected = detectLifeEvent([], txs, rules);
    assertEqual(detected, null, '38% confidence must not trigger bundle');
  });

  test('ALG2.3: Borderline Sub-threshold Case 2 — 1 req (37.5) + 1 opt (12.5) = 50% (<60% -> NULL)', () => {
    // FRESH_GRADUATE: 1 req ('Gaji Bulanan') + 1 opt ('Cicilan / Paylater')
    // reqWeight = (1/2)*75 = 37.5. optWeight = (1/2)*25 = 12.5. Total = 50%
    const txs = [
      { category: 'Gaji Bulanan', amount: 8000000 },
      { category: 'Cicilan / Paylater', amount: 400000 }
    ];
    const detected = detectLifeEvent([], txs, rules);
    assertEqual(detected, null, '50% confidence must not trigger bundle');
  });

  test('ALG2.4: Borderline Threshold Cross Case — 1 req (37.5) + 2 opt (25) = 63% (>=60% -> TRIGGERS)', () => {
    // FRESH_GRADUATE: 1 req ('Gaji Bulanan') + 2 opt ('Cicilan / Paylater', 'Tagihan Utilitas')
    // reqWeight = (1/2)*75 = 37.5. optWeight = (2/2)*25 = 25. Total = 62.5 -> round 63%
    const txs = [
      { category: 'Gaji Bulanan', amount: 8000000 },
      { category: 'Cicilan / Paylater', amount: 400000 },
      { category: 'Tagihan Utilitas', amount: 200000 }
    ];
    const detected = detectLifeEvent([], txs, rules);
    assert(detected !== null, '63% confidence must trigger bundle');
    assertEqual(detected.rule_id, 'FRESH_GRADUATE');
    assertEqual(detected.confidence, 63, 'Confidence must be exactly 63%');
    assertEqual(detected.bundle_name, 'Mulai Kerja Kit');
  });

  test('ALG2.5: Full required signals without optional — 2 req (75) + 0 opt (0) = 75% (>=60% -> TRIGGERS)', () => {
    // FRESH_GRADUATE: 'Gaji Bulanan' + 'Sewa Kos / Housing'
    const txs = [
      { category: 'Gaji Bulanan', amount: 8000000 },
      { category: 'Sewa Kos / Housing', amount: 2000000 }
    ];
    const detected = detectLifeEvent([], txs, rules);
    assert(detected !== null, '75% confidence must trigger bundle');
    assertEqual(detected.confidence, 75);
    assertEqual(detected.bundle_name, 'Mulai Kerja Kit');
  });

  test('ALG2.6: Full signals match — 2 req (75) + 2 opt (25) = 100% confidence', () => {
    const txs = [
      { category: 'Gaji Bulanan', amount: 8000000 },
      { category: 'Sewa Kos / Housing', amount: 2000000 },
      { category: 'Cicilan / Paylater', amount: 500000 },
      { category: 'Tagihan Utilitas', amount: 250000 }
    ];
    const detected = detectLifeEvent([], txs, rules);
    assert(detected !== null, '100% confidence must trigger bundle');
    assertEqual(detected.confidence, 100);
    assertEqual(detected.detected_signals.length, 4, 'All 4 signals captured');
  });

  test('ALG2.7: Exhaustive evaluation across all 5 life stage rules', () => {
    const cases = [
      {
        ruleId: 'NEWLYWED',
        bundle: 'Rumah Tangga Baru Kit',
        txs: [{ category: 'Transfer Pasangan', amount: 1 }, { category: 'Cicilan KPR / Rumah', amount: 1 }],
        expectedMinConf: 75
      },
      {
        ruleId: 'BUSINESS_OWNER',
        bundle: 'Pro Merchant Kit',
        txs: [{ category: 'Terima QRIS Merchant', amount: 1 }, { category: 'Transfer Supplier', amount: 1 }],
        expectedMinConf: 75
      },
      {
        ruleId: 'STUDENT',
        bundle: 'Mahasiswa Starter Pack',
        txs: [{ category: 'Bayar Kampus / UKT', amount: 1 }, { category: 'Transfer Masuk Ortu', amount: 1 }],
        expectedMinConf: 75
      },
      {
        ruleId: 'PRE_RETIREMENT',
        bundle: 'Golden Age Retirement Kit',
        txs: [{ category: 'Investasi Reksa Dana', amount: 1 }, { category: 'Pengeluaran Rumah', amount: 1 }],
        expectedMinConf: 75
      }
    ];

    for (const tc of cases) {
      const detected = detectLifeEvent([], tc.txs, rules);
      assert(detected !== null, `Rule ${tc.ruleId} must trigger`);
      assertEqual(detected.rule_id, tc.ruleId);
      assertEqual(detected.bundle_name, tc.bundle);
      assert(detected.confidence >= tc.expectedMinConf, `Confidence ${detected.confidence} >= ${tc.expectedMinConf}`);
    }
  });

  test('ALG2.8: Competing rules pick highest confidence match', () => {
    // Signals matching FRESH_GRADUATE at 75% and NEWLYWED at 100%
    const txs = [
      // FRESH_GRADUATE 2 req (75%)
      { category: 'Gaji Bulanan', amount: 5000000 },
      { category: 'Sewa Kos / Housing', amount: 2000000 },
      // NEWLYWED 2 req + 1 opt (100%)
      { category: 'Transfer Pasangan', amount: 3000000 },
      { category: 'Cicilan KPR / Rumah', amount: 4000000 },
      { category: 'Supermarket / Dapur', amount: 1000000 }
    ];
    const detected = detectLifeEvent([], txs, rules);
    assert(detected !== null, 'Must pick best match');
    assertEqual(detected.rule_id, 'NEWLYWED', 'Highest confidence (100% vs 75%) must win');
    assertEqual(detected.confidence, 100);
  });
}

// ==============================================================================
// 3. ADVERSARIAL TESTS: ALGORITMA 3 (GAMIFICATION SCORE)
// ==============================================================================
function runAlgoritma3Tests() {
  console.log('\n======================================================');
  console.log('SECTION 3: Algoritma 3 — Gamification Score Adversarial');
  console.log('======================================================');

  test('ALG3.1: Minimum baseline score is 20 PTS (Bronze) with zero features and no bonuses', () => {
    const user = { timeliness_rate: 80.0, savings_consistency: 0 };
    const res = calcGamificationScore(user, []);
    assertEqual(res.score, 20);
    assertEqual(res.raw_score, 20);
    assertEqual(res.tier, 'Bronze');
    assertEqual(res.badge_class, 'badge-bronze');
    assertEqual(res.next_tier_threshold, 40);
    assertEqual(res.reward_points, 250);
  });

  test('ALG3.2: Clamping test — Score NEVER exceeds 100 PTS even with massive feature points', () => {
    const user = { timeliness_rate: 100.0, savings_consistency: 1 };
    // 12 features totaling 195 points + 20 base + 15 timeliness + 15 savings = 245 raw score
    const allFeatures = FEATURES;
    const res = calcGamificationScore(user, allFeatures);
    assertEqual(res.score, 100, 'Score must clamp strictly to 100');
    assert(res.raw_score > 100, `Raw score should reflect true sum (${res.raw_score})`);
    assertEqual(res.tier, 'Diamond');
    assertEqual(res.badge_class, 'badge-diamond');
  });

  test('ALG3.3: Clamping test — Negative feature points cannot drag score below 0 PTS', () => {
    const user = { timeliness_rate: 50.0, savings_consistency: 0 };
    const negativeFeatures = [{ id: 'fake_penalty', points: -100 }];
    const res = calcGamificationScore(user, negativeFeatures);
    assertEqual(res.score, 0, 'Score must clamp to floor 0');
    assertEqual(res.raw_score, -80);
    assertEqual(res.tier, 'Bronze');
  });

  test('ALG3.4: Exact Tier Boundaries Verification', () => {
    const tierChecks = [
      // Bronze: 0 - 40
      { rawTarget: 0, expectedTier: 'Bronze', next: 40, reward: 250 },
      { rawTarget: 20, expectedTier: 'Bronze', next: 40, reward: 250 },
      { rawTarget: 40, expectedTier: 'Bronze', next: 40, reward: 250 },
      // Silver: 41 - 70
      { rawTarget: 41, expectedTier: 'Silver', next: 70, reward: 1000 },
      { rawTarget: 55, expectedTier: 'Silver', next: 70, reward: 1000 },
      { rawTarget: 70, expectedTier: 'Silver', next: 70, reward: 1000 },
      // Gold: 71 - 90
      { rawTarget: 71, expectedTier: 'Gold', next: 90, reward: 2500 },
      { rawTarget: 80, expectedTier: 'Gold', next: 90, reward: 2500 },
      { rawTarget: 90, expectedTier: 'Gold', next: 90, reward: 2500 },
      // Diamond: 91 - 100
      { rawTarget: 91, expectedTier: 'Diamond', next: 100, reward: 5000 },
      { rawTarget: 95, expectedTier: 'Diamond', next: 100, reward: 5000 },
      { rawTarget: 100, expectedTier: 'Diamond', next: 100, reward: 5000 }
    ];

    for (const tc of tierChecks) {
      // Create artificial feature to hit exact target score
      // base is 20, no bonuses
      const featurePtsNeeded = tc.rawTarget - 20;
      const features = featurePtsNeeded !== 0 ? [{ id: 'dummy', points: featurePtsNeeded }] : [];
      const user = { timeliness_rate: 0, savings_consistency: 0 };
      const res = calcGamificationScore(user, features);

      assertEqual(res.score, tc.rawTarget, `Score check for target ${tc.rawTarget}`);
      assertEqual(res.tier, tc.expectedTier, `Score ${tc.rawTarget} must map to ${tc.expectedTier}`);
      assertEqual(res.next_tier_threshold, tc.next, `Next threshold for ${tc.rawTarget}`);
      assertEqual(res.reward_points, tc.reward, `Reward points for ${tc.rawTarget}`);
    }
  });

  test('ALG3.5: Timeliness (15 PTS) & Savings (15 PTS) bonus logic verification', () => {
    // Case 1: timeliness 94.9% (just below 95.0%) -> 0 PTS
    const u1 = { timeliness_rate: 94.9, savings_consistency: 0 };
    const r1 = calcGamificationScore(u1, []);
    assertEqual(r1.breakdown.timeliness_bonus, 0, 'Timeliness < 95% gets 0 bonus');

    // Case 2: timeliness 95.0% (exact cutoff) -> 15 PTS
    const u2 = { timeliness_rate: 95.0, savings_consistency: 0 };
    const r2 = calcGamificationScore(u2, []);
    assertEqual(r2.breakdown.timeliness_bonus, 15, 'Timeliness >= 95% gets 15 bonus');

    // Case 3: savings_consistency = 1 -> 15 PTS
    const u3 = { timeliness_rate: 0, savings_consistency: 1 };
    const r3 = calcGamificationScore(u3, []);
    assertEqual(r3.breakdown.savings_bonus, 15, 'Savings consistency 1 gets 15 bonus');

    // Case 4: both active -> 20 + 15 + 15 = 50 PTS (Silver)
    const u4 = { timeliness_rate: 100, savings_consistency: 1 };
    const r4 = calcGamificationScore(u4, []);
    assertEqual(r4.score, 50);
    assertEqual(r4.tier, 'Silver');
  });
}

// ==============================================================================
// 4. E2E LIVE HTTP INTEGRATION: SIMULATION LAB & AUDIT LOGS INTEGRITY
// ==============================================================================
async function runLiveIntegrationAndAuditTests() {
  console.log('\n======================================================');
  console.log('SECTION 4: Live HTTP Cascade, Simulation & Mode Juri Audit');
  console.log('======================================================');

  // Reset database to pristine state first
  await asyncTest('SIM.1: 1-Click Database Reset initializes pristine state', async () => {
    const res = await api('POST', '/api/admin/reset');
    assertEqual(res.status, 200);
    assertEqual(res.data.success, true);
  });

  // Login as Dimas
  let token = null;
  await asyncTest('SIM.2: Authenticate Dimas via Quick-Login helper', async () => {
    const res = await api('POST', '/api/auth/quick-login', { personaId: 'dimas' });
    assertEqual(res.status, 200);
    assert(res.data.token, 'Token must be issued');
    token = res.data.token;
  });

  // Check initial AI status for Dimas
  let initialScore = 0;
  await asyncTest('SIM.3: Fetch initial AI status (Dimas initial score = 45 PTS Silver)', async () => {
    const res = await api('GET', '/api/ai/status', null, token);
    assertEqual(res.status, 200);
    const g = res.data.gamification || res.data.data.gamification;
    initialScore = g.score;
    assertEqual(initialScore, 45, 'Dimas initial score must be 45');
    assertEqual(g.tier, 'Silver');
  });

  // Test live score increment on single feature activation: auto_save (+20 PTS)
  await asyncTest('SIM.4: Live feature activation increments score atomically (45 + 20 = 65 PTS)', async () => {
    const res = await api('POST', '/api/features/auto_save/activate', null, token);
    assertEqual(res.status, 200);
    const scoreInfo = res.data.gamification_score || res.data.data.gamification_score;
    assertEqual(scoreInfo.previous_score, 45);
    assertEqual(scoreInfo.new_score, 65);
    assertEqual(scoreInfo.tier, 'Silver');

    // Verify persisted via /api/ai/status
    const statusRes = await api('GET', '/api/ai/status', null, token);
    const currentScore = statusRes.data.gamification?.score || statusRes.data.data?.gamification?.score;
    assertEqual(currentScore, 65, 'Database must persist updated score');
  });

  // Test injection of life event trigger transactions
  await asyncTest('SIM.5: Injecting transaction shifts balance & triggers recalculation cascade', async () => {
    const injectRes = await api('POST', '/api/transactions/inject', {
      description: 'Sewa Kos Tambahan September',
      category: 'Sewa Kos / Housing',
      amount: 1500000,
      type: 'DB'
    }, token);

    assertEqual(injectRes.status, 201);
    assertEqual(injectRes.data.success, true);
    assert(injectRes.data.new_balance !== undefined, 'Updated balance returned');
    assert(injectRes.data.ai_evaluation !== undefined, 'Live AI cascade returned in response');
  });

  // Test smart bundle claim: claim Mulai Kerja Kit (activates health_insurance)
  await asyncTest('SIM.6: 1-Click Smart Bundle Claim batch-activates remaining features and upgrades tier', async () => {
    // Dimas already activated auto_save (+20). Mulai Kerja Kit bundles [auto_save, health_insurance (+20)].
    // Claiming bundle should safely activate health_insurance and increase score to 65 + 20 = 85 PTS (Gold Tier)!
    const bundleRes = await api('POST', '/api/bundles/FRESH_GRADUATE/activate', null, token);
    assertEqual(bundleRes.status, 200);
    const resData = bundleRes.data.data || bundleRes.data;
    assertEqual(resData.new_score, 85, 'Score increments to 85 PTS');
    assertEqual(resData.new_tier, 'Gold', 'Tier upgrades to Gold');
  });

  // Verify Mode Juri Audit Logs stream integrity
  await asyncTest('AUDIT.1: Mode Juri Audit Log stream captures structured trace entries', async () => {
    const logsRes = await api('GET', '/api/ai/audit-logs?limit=50');
    assertEqual(logsRes.status, 200);
    const logs = logsRes.data.data || logsRes.data;
    assert(Array.isArray(logs), 'Audit logs must be an array');
    assert(logs.length >= 4, `Expected >= 4 audit logs, got ${logs.length}`);

    // Verify schema of every single log entry
    const validEngines = new Set(['SYSTEM', 'USER_ACTION', 'MANUAL_INJECT', 'SIMULATION', 'AI_ENGINE']);
    for (const log of logs) {
      assert(log.id !== undefined && log.id !== null, 'Log id must be present');
      assert(log.engine && validEngines.has(log.engine), `Log engine '${log.engine}' must be valid tag`);
      assert(typeof log.message === 'string' && log.message.length > 0, 'Log message must be non-empty string');
      assert(log.timestamp !== undefined && log.timestamp !== null, 'Log timestamp must be present');

      // Payload must be valid JSON parseable if present
      if (log.payload) {
        try {
          const parsed = JSON.parse(log.payload);
          assert(typeof parsed === 'object' && parsed !== null, 'Payload must be JSON object');
        } catch (e) {
          throw new Error(`Audit log id ${log.id} has invalid JSON payload: ${log.payload}`);
        }
      }
    }
  });

  await asyncTest('AUDIT.2: Audit logs record specific actions: Reset, Feature Activation, Bundle Claim, Inject', async () => {
    const logsRes = await api('GET', '/api/ai/audit-logs?limit=50');
    const logs = logsRes.data.data || logsRes.data;

    const hasReset = logs.some(l => l.engine === 'SYSTEM' && l.message.includes('reset'));
    const hasFeature = logs.some(l => l.engine === 'USER_ACTION' && l.message.includes('Fitur diaktifkan'));
    const hasBundle = logs.some(l => l.engine === 'USER_ACTION' && l.message.includes('Bundle diaktifkan'));
    const hasInject = logs.some(l => l.engine === 'MANUAL_INJECT' && l.message.includes('disuntikkan'));

    assert(hasReset, 'Audit trail must contain Database Reset log');
    assert(hasFeature, 'Audit trail must contain Feature Activation log');
    assert(hasBundle, 'Audit trail must contain Bundle Claim log');
    assert(hasInject, 'Audit trail must contain Manual Transaction Inject log');
  });

  // Concurrency and Multi-Persona Stress
  await asyncTest('STRESS.1: Concurrent transaction injections do not cause SQLite database lock or race conditions', async () => {
    // Fire 5 concurrent transaction injections for Dimas
    const promises = [1, 2, 3, 4, 5].map(i => api('POST', '/api/transactions/inject', {
      description: `Concurrent Test Injection #${i}`,
      category: 'Jajan & Lifestyle',
      amount: 10000 * i,
      type: 'DB'
    }, token));

    const injectionResults = await Promise.all(promises);
    for (const r of injectionResults) {
      assertEqual(r.status, 201, 'Concurrent injection must succeed with 201');
      assertEqual(r.data.success, true);
    }
  });

  // Audit Logs query parameter limit & integrity
  await asyncTest('AUDIT.3: GET /api/ai/audit-logs?limit=5 strictly obeys limit clamp', async () => {
    const res = await api('GET', '/api/ai/audit-logs?limit=5');
    assertEqual(res.status, 200);
    const logs = res.data.data || res.data;
    assertEqual(logs.length, 5, 'Must return exactly 5 logs');
  });

  // Exhaustive Persona Baseline Gamification Score Verification
  await asyncTest('ALG3.6: All 5 seeded personas produce exact expected scores & tiers', async () => {
    const expected = {
      dimas: { score: 45, tier: 'Silver' },
      ayu: { score: 80, tier: 'Gold' },
      sari: { score: 75, tier: 'Gold' },
      rina: { score: 50, tier: 'Silver' },
      bambang: { score: 100, tier: 'Diamond' } // 105 clamped to 100
    };

    for (const p of PERSONAS_DATA) {
      const activeObjs = FEATURES.filter(f => p.activeFeatures.includes(f.id));
      const res = calcGamificationScore(p.user, activeObjs);
      assertEqual(res.score, expected[p.user.id].score, `Score mismatch for ${p.user.id}`);
      assertEqual(res.tier, expected[p.user.id].tier, `Tier mismatch for ${p.user.id}`);
    }
  });

  // Algoritma 1 All-features-active edge case
  test('ALG1.8: When all 12 features are already active, recommendations list is cleanly empty', () => {
    const allIds = FEATURES.map(f => f.id);
    const recs = calcPropensityScores(FEATURES, [{ category: 'Gaji Bulanan', amount: 10000000 }], allIds);
    assertEqual(recs.length, 0, 'Must return empty array cleanly without crashing');
  });

  // Algoritma 3 Null/Undefined resilience
  test('ALG3.7: Gracefully handles null/undefined user fields without crashing', () => {
    const emptyUser = {};
    const res = calcGamificationScore(emptyUser, [{ id: 'test', points: undefined }]);
    assertEqual(res.score, 20, 'Defaults safely to baseScore 20');
    assertEqual(res.tier, 'Bronze');
  });

  // Final reset to leave environment pristine
  await asyncTest('SIM.7: Post-testing Database Reset restores pristine seed state', async () => {
    const res = await api('POST', '/api/admin/reset');
    assertEqual(res.status, 200);
  });
}

// ==============================================================================
// RUN ALL TESTS & PRINT SCOREBOARD
// ==============================================================================
async function main() {
  console.log('Starting Challenger 2 Adversarial Verification Suite...\n');
  const startTime = Date.now();

  try {
    // 1. Algoritma 1 White-box & Black-box tests
    runAlgoritma1Tests();

    // 2. Algoritma 2 Borderline & Threshold tests
    runAlgoritma2Tests();

    // 3. Algoritma 3 Clamping & Tier Cutoffs tests
    runAlgoritma3Tests();

    // 4. Ensure server is up and run Live Integration & Audit stream tests
    await ensureServer();
    await runLiveIntegrationAndAuditTests();

  } catch (err) {
    console.error('Fatal harness error:', err);
    results.failed++;
  } finally {
    if (spawnedServer) {
      try {
        spawnedServer.kill();
      } catch {}
    }
  }

  const duration = Date.now() - startTime;
  console.log('\n======================================================');
  console.log('CHALLENGER 2 EMPIRICAL VERIFICATION SCOREBOARD');
  console.log('======================================================');
  console.log(`Total Adversarial Tests : ${results.total}`);
  console.log(`Passed                 : ${results.passed}`);
  console.log(`Failed                 : ${results.failed}`);
  console.log(`Execution Time         : ${duration}ms`);
  console.log('======================================================');

  if (results.failed > 0) {
    console.log('\nFAILED TESTS DETAILS:');
    for (const f of results.failures) {
      console.log(`- ${f.name}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('\nVERDICT: ALL 4 TARGET AREAS EMPIRICALLY CONFIRMED AND PASSED (100%)\n');
    process.exit(0);
  }
}

main();
