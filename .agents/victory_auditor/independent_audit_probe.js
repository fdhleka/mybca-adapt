/**
 * Independent Victory Auditor Probe
 * Directly verifies all R1-R5 requirements and Acceptance Criteria against live server and SQLite DB.
 */

const http = require('http');
const { spawn } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const DB_PATH = path.resolve(__dirname, '..', '..', 'server', 'db', 'database.sqlite');

let passed = 0;
let failed = 0;
const failures = [];
let spawnedServer = null;

function check(desc, condition, extraInfo = '') {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${desc} - ${extraInfo}`);
    failures.push({ desc, extraInfo });
    failed++;
  }
}

async function request(method, urlPath, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const headers = {
      'Accept': 'application/json'
    };
    let payload = null;
    if (body) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function isAlive() {
  try {
    const res = await request('GET', '/api/personas');
    return res.status === 200;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await isAlive()) return;
  const projectRoot = path.resolve(__dirname, '..', '..');
  const serverPath = path.join(projectRoot, 'server', 'server.js');
  spawnedServer = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    stdio: 'ignore',
    env: { ...process.env, PORT: '3000' }
  });

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 150));
    if (await isAlive()) {
      return;
    }
  }
  throw new Error('Timed out waiting for server to start on port 3000');
}

async function runAudit() {
  await ensureServer();

  console.log('======================================================================');
  console.log('   INDEPENDENT VICTORY AUDITOR FORENSIC PROBE');
  console.log('======================================================================\n');

  // --- 1. Database Reset & Schema Verification ---
  console.log('--- TEST GROUP 1: SQLite Persistence & Reset ---');
  const resetRes = await request('POST', '/api/admin/reset');
  check('1-Click Reset returns 200', resetRes.status === 200);
  check('1-Click Reset duration < 50ms', resetRes.body.duration_ms < 50, `duration=${resetRes.body.duration_ms}ms`);

  const db = new DatabaseSync(DB_PATH);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name);
  const expectedTables = ['accounts', 'audit_logs', 'features', 'life_event_rules', 'simulation_scenarios', 'transactions', 'user_features', 'user_life_events', 'users'];
  const allTablesPresent = expectedTables.every(t => tables.includes(t));
  check('SQLite DB contains all 9 required relational tables', allTablesPresent, `tables: ${tables.join(',')}`);

  // --- 2. R1: Authentication & Personas ---
  console.log('\n--- TEST GROUP 2: R1 Authentic Login & Multi-Persona Switcher ---');
  const personas = ['dimas', 'ayu', 'sari', 'rina', 'bambang'];
  const personaData = {};

  for (const pid of personas) {
    const qLogin = await request('POST', '/api/auth/quick-login', { persona_id: pid });
    check(`Quick login for persona '${pid}' succeeds (HTTP 200)`, qLogin.status === 200);
    check(`Token returned for '${pid}'`, typeof qLogin.body.token === 'string' && qLogin.body.token.length > 10);
    personaData[pid] = qLogin.body;
  }

  // Form login check for Dimas using authentic seeded credentials
  const formLogin = await request('POST', '/api/auth/login', { bca_id: 'dimas2026', password: 'Password123!' });
  check('Standard form login with BCA ID and password succeeds (HTTP 200)', formLogin.status === 200);
  check('Form login returns correct user name Dimas Prasetyo', formLogin.body?.user?.name === 'Dimas Prasetyo');

  // Invalid login check
  const badLogin = await request('POST', '/api/auth/login', { bca_id: 'dimas2026', password: 'wrongpassword' });
  check('Invalid password returns HTTP 401', badLogin.status === 401);

  // Logout check
  const dimasToken = personaData['dimas'].token;
  const logoutRes = await request('POST', '/api/auth/logout', null, dimasToken);
  check('Logout returns HTTP 200', logoutRes.status === 200);
  const checkSession = await request('GET', '/api/auth/session', null, dimasToken);
  check('Session invalidated after logout (HTTP 401)', checkSession.status === 401);

  // Re-login Dimas for subsequent tests
  const reLoginDimas = await request('POST', '/api/auth/quick-login', { persona_id: 'dimas' });
  const activeDimasToken = reLoginDimas.body.token;

  // --- 3. R3: Multi-Tenant State Isolation (100% Distinct Data) ---
  console.log('\n--- TEST GROUP 3: R3 Multi-Tenant State Isolation ---');
  const balances = [];
  const accountNos = [];
  const names = [];

  for (const pid of personas) {
    const token = pid === 'dimas' ? activeDimasToken : personaData[pid].token;
    const accRes = await request('GET', '/api/accounts/me', null, token);
    check(`Account fetch for '${pid}' succeeds`, accRes.status === 200);
    balances.push(accRes.body.balance);
    accountNos.push(accRes.body.account_no);
    names.push(personaData[pid].user.name);
  }

  const uniqueBalances = new Set(balances);
  const uniqueAccounts = new Set(accountNos);
  const uniqueNames = new Set(names);
  check('All 5 personas have 100% distinct account numbers', uniqueAccounts.size === 5, `accounts=${accountNos}`);
  check('All 5 personas have 100% distinct account balances', uniqueBalances.size === 5, `balances=${balances}`);
  check('All 5 personas have 100% distinct customer names', uniqueNames.size === 5, `names=${names}`);

  // --- 4. R4: AI Engine Live Recalculation ---
  console.log('\n--- TEST GROUP 4: R4 3 AI Engines Recalculation ---');
  const dimasAiRes = await request('GET', '/api/ai/status', null, activeDimasToken);
  check('GET /api/ai/status returns HTTP 200', dimasAiRes.status === 200);
  const aiData = dimasAiRes.body.data || dimasAiRes.body;

  // Algoritma 1
  check('Algoritma 1: Propensity recommendations present', Array.isArray(aiData.propensity) && aiData.propensity.length > 0);
  const topRec = aiData.propensity[0];
  check('Algoritma 1: Top recommendation has score between 15% and 99%', topRec.score >= 15 && topRec.score <= 99, `score=${topRec.score}`);
  check('Algoritma 1: Contextual reason provided based on transaction pattern', typeof topRec.reason === 'string' && topRec.reason.length > 10);

  // Algoritma 2
  check('Algoritma 2: Life event evaluated', typeof aiData.life_event === 'object');
  check('Algoritma 2: Fresh Grad persona has confidence >= 60%', aiData.life_event.confidence >= 60, `conf=${aiData.life_event.confidence}`);
  check('Algoritma 2: Smart bundle proposed (Mulai Kerja Kit)', aiData.life_event.bundle_name === 'Mulai Kerja Kit');

  // Algoritma 3
  check('Algoritma 3: Gamification score matches 45 PTS for Dimas', aiData.gamification.score === 45, `score=${aiData.gamification.score}`);
  check('Algoritma 3: Dimas mapped to Silver tier', aiData.gamification.tier === 'Silver');

  // Live Feature Activation and Score Increment
  const featToActivate = topRec.feature_id;
  const activateRes = await request('POST', `/api/features/${featToActivate}/activate`, null, activeDimasToken);
  check(`1-Click Feature Activation for '${featToActivate}' returns HTTP 200`, activateRes.status === 200);
  const newScore = activateRes.body.gamification_score.new_score;
  const ptsAwarded = activateRes.body.points_awarded;
  check('Gamification score incremented in real-time by feature points', newScore === 45 + ptsAwarded, `newScore=${newScore}, expected=${45 + ptsAwarded}`);

  // --- 5. R5: Simulation Lab & Data Injector ---
  console.log('\n--- TEST GROUP 5: R5 Simulation Lab & Mutation Invariant ---');
  const preAccRes = await request('GET', '/api/accounts/me', null, activeDimasToken);
  const preBalance = preAccRes.body.balance;

  const injectCredit = await request('POST', '/api/transactions/inject', {
    description: 'Audit Test Gaji Masuk',
    category: 'Gaji Bulanan',
    amount: 1500000,
    type: 'CR'
  }, activeDimasToken);

  check('Transaction injection (CR) succeeds with HTTP 201', injectCredit.status === 201);
  check('Account balance increased exactly by +1,500,000 IDR', injectCredit.body.new_balance === preBalance + 1500000, `got=${injectCredit.body.new_balance}, expected=${preBalance + 1500000}`);

  const injectDebit = await request('POST', '/api/transactions/inject', {
    description: 'Audit Test Bayar Belanja',
    category: 'Supermarket / Dapur',
    amount: 500000,
    type: 'DB'
  }, activeDimasToken);

  check('Transaction injection (DB) succeeds with HTTP 201', injectDebit.status === 201);
  check('Account balance decreased exactly by -500,000 IDR', injectDebit.body.new_balance === preBalance + 1500000 - 500000);

  // Check audit log stream
  const auditLogsRes = await request('GET', '/api/ai/audit-logs?limit=5');
  check('GET /api/ai/audit-logs returns HTTP 200', auditLogsRes.status === 200);
  const logs = auditLogsRes.body.data || auditLogsRes.body;
  const foundInjectLog = logs.some(l => l.engine === 'MANUAL_INJECT' && l.message.includes('Audit Test Bayar Belanja'));
  check('Mode Juri Audit stream contains live log of injected transaction', foundInjectLog);

  // Final Reset to leave DB pristine
  console.log('\n--- TEST GROUP 6: Post-Audit Reversion ---');
  const finalReset = await request('POST', '/api/admin/reset');
  check('Post-audit DB reset restores initial state', finalReset.status === 200);

  const postResetAcc = db.prepare("SELECT balance FROM accounts WHERE user_id = 'dimas'").get();
  check('Dimas balance reverted to initial seed 14,500,000 IDR', postResetAcc.balance === 14500000, `balance=${postResetAcc.balance}`);

  console.log('\n======================================================================');
  console.log(`  AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (spawnedServer) {
    spawnedServer.kill();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  if (spawnedServer) spawnedServer.kill();
  console.error('Audit probe encountered unhandled error:', err);
  process.exit(1);
});
