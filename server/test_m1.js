/**
 * Automated Verification Test Suite for Milestone 1
 * myBCA ADAPT — SQLite Persistence, Seed Engine & REST API
 */

const http = require('node:http');
const assert = require('node:assert');
const { getDb, migrate, queryOne, queryAll, closeDb } = require('./db/database');
const { seedDatabase, resetDatabase } = require('./db/seed');
const { app, ensureDatabaseReady } = require('./server');

let server;
const TEST_PORT = 3199;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (dataString) {
      reqHeaders['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let rawData = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: rawData });
        }
      });
    });

    req.on('error', reject);
    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('  myBCA ADAPT — Milestone 1 Comprehensive Verification Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
      failed++;
    }
  }

  // Phase 1: Database Migration & Schema
  console.log('--- Phase 1: SQLite DDL Migration & Schema Integrity ---');
  test('All 9 Relational Tables Exist', () => {
    const db = getDb();
    migrate(db);
    const tables = queryAll("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const tableNames = tables.map(t => t.name);

    const requiredTables = [
      'users',
      'accounts',
      'features',
      'user_features',
      'transactions',
      'life_event_rules',
      'user_life_events',
      'audit_logs',
      'simulation_scenarios'
    ];

    for (const tbl of requiredTables) {
      assert(tableNames.includes(tbl), `Table '${tbl}' is missing from database schema`);
    }
  });

  test('Foreign Keys & WAL Mode Are Enabled', () => {
    const fk = queryOne('PRAGMA foreign_keys');
    assert.strictEqual(fk.foreign_keys, 1, 'PRAGMA foreign_keys must be enabled (1)');
    const jm = queryOne('PRAGMA journal_mode');
    assert.strictEqual(jm.journal_mode.toLowerCase(), 'wal', 'PRAGMA journal_mode must be WAL');
  });

  // Phase 2: Pristine Seed Dataset
  console.log('\n--- Phase 2: Pristine Seed Engine & Persona Verification ---');
  test('Pristine Seeding Completes with Correct Counts', () => {
    const res = seedDatabase();
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.summary.personas_seeded, 5);
    assert.strictEqual(res.summary.accounts_seeded, 5);
    assert.strictEqual(res.summary.features_seeded, 12);
    assert.strictEqual(res.summary.rules_seeded, 5);
    assert.strictEqual(res.summary.scenarios_seeded, 3);
    assert.strictEqual(res.summary.transactions_seeded, 35);
    assert.strictEqual(res.summary.active_features_seeded, 9);
  });

  test('All 5 Personas Exist with Authentic Profiles and Balances', () => {
    const expected = [
      { id: 'dimas', bcaId: 'dimas2026', balance: 14500000, accType: 'Tahapan BCA' },
      { id: 'ayu', bcaId: 'ayu2026', balance: 38200000, accType: 'Tahapan BCA' },
      { id: 'sari', bcaId: 'sari2026', balance: 125400000, accType: 'BCA Bisnis' },
      { id: 'rina', bcaId: 'rina2026', balance: 3400000, accType: 'Tahapan Xpresi' },
      { id: 'bambang', bcaId: 'bambang2026', balance: 245000000, accType: 'Tahapan BCA' }
    ];

    for (const exp of expected) {
      const user = queryOne('SELECT * FROM users WHERE id = ?', [exp.id]);
      assert(user, `User '${exp.id}' not found`);
      assert.strictEqual(user.bca_id, exp.bcaId, `User '${exp.id}' bca_id mismatch`);

      const account = queryOne('SELECT * FROM accounts WHERE user_id = ?', [exp.id]);
      assert(account, `Account for '${exp.id}' not found`);
      assert.strictEqual(account.balance, exp.balance, `Account balance for '${exp.id}' mismatch`);
      assert.strictEqual(account.account_type, exp.accType, `Account type for '${exp.id}' mismatch`);
    }
  });

  // Phase 3: 1-Click Reset Performance (<50ms)
  console.log('\n--- Phase 3: 1-Click Atomic DB Reset Engine (<50ms) ---');
  test('Atomic Reset Restores Pristine State in < 50ms', () => {
    const reset = resetDatabase();
    assert.strictEqual(reset.success, true);
    assert.strictEqual(reset.summary.personas_seeded, 5);
    assert.strictEqual(reset.summary.transactions_seeded, 35);
    console.log(`         Reset execution duration: ${reset.duration_ms}ms (Target: <50ms)`);
    assert(reset.duration_ms < 50, `Reset took ${reset.duration_ms}ms, which exceeds 50ms threshold`);
  });

  // Phase 4: REST API Integration via HTTP
  console.log('\n--- Phase 4: Express REST API Endpoints via HTTP ---');

  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      resolve();
    });
  });

  let dimasToken = null;
  let ayuToken = null;

  await testAsync('GET /api (Health Check)', async () => {
    const res = await request('GET', '/api');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ONLINE');
  });

  await testAsync('GET /api/personas (Quick Switcher Dropdown Data)', async () => {
    const res = await request('GET', '/api/personas');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.data), 'Expected array of personas');
    assert.strictEqual(res.data.data.length, 5);
  });

  await testAsync('POST /api/auth/login (Authentic Credentials)', async () => {
    const res = await request('POST', '/api/auth/login', {
      bca_id: 'dimas2026',
      password: 'Password123!'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(res.data.token, 'Token must be returned');
    assert.strictEqual(res.data.user.id, 'dimas');
    dimasToken = res.data.token;
  });

  await testAsync('POST /api/auth/login (Invalid Password returns 401)', async () => {
    const res = await request('POST', '/api/auth/login', {
      bca_id: 'dimas2026',
      password: 'WrongPassword'
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  await testAsync('POST /api/auth/quick-login (Judge 1-Click Switcher for Ayu)', async () => {
    const res = await request('POST', '/api/auth/quick-login', {
      persona_id: 'ayu'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.user.id, 'ayu');
    assert.strictEqual(res.data.account.balance, 38200000);
    ayuToken = res.data.token;
  });

  await testAsync('GET /api/accounts/me (Active Account)', async () => {
    const res = await request('GET', '/api/accounts/me', null, {
      Authorization: `Bearer ${dimasToken}`
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.account_no, '8820491823');
    assert.strictEqual(res.data.balance, 14500000);
  });

  await testAsync('GET /api/transactions (Current Period Transactions for Dimas)', async () => {
    const res = await request('GET', '/api/transactions?period=current', null, {
      Authorization: `Bearer ${dimasToken}`
    });
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.data), 'Expected array of transactions');
    assert.strictEqual(res.data.data.length, 5);
  });

  await testAsync('POST /api/transactions/inject (Atomic Mutation & Balance Update)', async () => {
    const res = await request('POST', '/api/transactions/inject', {
      description: 'Gaji Tambahan Proyek Freelance',
      category: 'Gaji Bulanan',
      amount: 5000000,
      type: 'CR'
    }, {
      Authorization: `Bearer ${dimasToken}`
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    // Previous balance 14.5M + 5M = 19.5M
    assert.strictEqual(res.data.new_balance, 19500000);
    assert(res.data.ai_evaluation, 'AI evaluation cascade must be returned');

    // Confirm in DB
    const acc = queryOne('SELECT balance FROM accounts WHERE user_id = ?', ['dimas']);
    assert.strictEqual(acc.balance, 19500000);
  });

  await testAsync('GET /api/features (12 Features with Status)', async () => {
    const res = await request('GET', '/api/features', null, {
      Authorization: `Bearer ${dimasToken}`
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.length, 12);
    const paylater = res.data.data.find(f => f.id === 'paylater_reminder');
    assert.strictEqual(paylater.is_active, true, 'paylater_reminder should be active for Dimas');
    const autoSave = res.data.data.find(f => f.id === 'auto_save');
    assert.strictEqual(autoSave.is_active, false, 'auto_save should not yet be active for Dimas');
  });

  await testAsync('POST /api/features/:id/activate (1-Click Feature Activation)', async () => {
    const res = await request('POST', '/api/features/auto_save/activate', null, {
      Authorization: `Bearer ${dimasToken}`
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.points_awarded, 20);
    // Dimas base score: 45 + 20 (auto_save) = 65
    assert.strictEqual(res.data.gamification_score.new_score, 65);
  });

  await testAsync('POST /api/features/:id/activate (Duplicate Activation Conflict 409)', async () => {
    const res = await request('POST', '/api/features/auto_save/activate', null, {
      Authorization: `Bearer ${dimasToken}`
    });
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.data.success, false);
  });

  await testAsync('GET /api/ai/status (AI Evaluation Pipeline)', async () => {
    const res = await request('GET', '/api/ai/status', null, {
      Authorization: `Bearer ${dimasToken}`
    });
    assert.strictEqual(res.status, 200);
    assert(res.data.propensity, 'Expected propensity recommendations');
    assert(res.data.life_event, 'Expected life event evaluation');
    assert.strictEqual(res.data.life_event.event_type, 'FRESH_GRADUATE');
    assert.strictEqual(res.data.life_event.confidence, 100);
    assert(res.data.gamification, 'Expected gamification health metrics');
    assert.strictEqual(res.data.gamification.score, 65);
  });

  await testAsync('GET /api/ai/audit-logs (Mode Juri Audit Stream)', async () => {
    const res = await request('GET', '/api/ai/audit-logs');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.data), 'Expected array of logs');
    assert(res.data.data.length > 0, 'Should contain audit logs from injections and activations');
  });

  await testAsync('POST /api/admin/reset (Live HTTP 1-Click Reset Endpoint)', async () => {
    const res = await request('POST', '/api/admin/reset');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.summary.personas_seeded, 5);
    assert.strictEqual(res.data.summary.transactions_seeded, 35);
    console.log(`         HTTP Reset response duration: ${res.data.duration_ms}ms`);

    // Verify Dimas balance reverted cleanly to pristine Rp 14.500.000
    const acc = queryOne('SELECT balance FROM accounts WHERE user_id = ?', ['dimas']);
    assert.strictEqual(acc.balance, 14500000, 'Balance must revert to pristine seed balance (14.5M)');
  });

  await testAsync('GET /api/admin/health (System Health Check)', async () => {
    const res = await request('GET', '/api/admin/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'UP');
    assert.strictEqual(res.data.tables.users, 5);
    assert.strictEqual(res.data.tables.accounts, 5);
    assert.strictEqual(res.data.tables.transactions, 35);
  });

  // Teardown
  server.close();
  closeDb();

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  if (server) server.close();
  closeDb();
  process.exit(1);
});
