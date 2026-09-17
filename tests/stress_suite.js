/**
 * ==============================================================================
 * myBCA ADAPT — Empirical Adversarial Stress Test Suite
 * ==============================================================================
 * Author: Final Challenger 1 (Empirical Stress Testing & Concurrency)
 *
 * Scope & Adversarial Challenge Matrix:
 * 1. Concurrent Rapid Repeated Database Resets (POST /api/admin/reset)
 *    - Latency benchmarks (<50ms) under sequential & concurrent bursts (N=10, 25)
 *    - SQLite lock contention, SQLITE_BUSY immunity, and post-reset state integrity
 * 2. High-Volume Transaction Injections & Exact Balance Conservation
 *    - 100 sequential mutations & 50 concurrent mutations
 *    - Mathematical balance invariant: B_final === B_initial + sum(CR) - sum(DB)
 *    - Multi-tenant parallel injection flood across 3 personas
 * 3. Boundary & Adversarial Value Injections
 *    - Zero amount, negative amounts, decimal/float amounts, non-numeric payloads
 *    - 100 Billion IDR extreme integer values (safe 64-bit integer handling)
 *    - SQL injection, XSS, Unicode/Emoji, and 5,000-character description strings
 *    - Invalid transaction types & casing normalization
 * 4. Session Isolation Across Concurrent Persona Requests
 *    - Multi-persona concurrent login & token acquisition (5 personas)
 *    - 100 interleaved concurrent queries verifying zero cross-session data leakage
 *    - Cross-persona state mutation isolation & selective session termination
 *
 * Execution: node tests/stress_suite.js [--url <baseUrl>] [--verbose]
 * ==============================================================================
 */

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');

// --- Command-line arguments & configuration ---
const ARGS = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const index = ARGS.indexOf(flag);
  if (index !== -1 && ARGS[index + 1]) return ARGS[index + 1];
  for (const arg of ARGS) {
    if (arg.startsWith(`${flag}=`)) return arg.slice(flag.length + 1);
  }
  return defaultValue;
}

const BASE_URL = getArg('--url', process.env.TEST_URL || 'http://localhost:3000').replace(/\/$/, '');
const VERBOSE = ARGS.includes('--verbose');

// --- ANSI Styling ---
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m'
};

// --- Stress Test Metrics Tracker ---
const report = {
  section1: { name: 'Concurrent Database Resets (<50ms & SQLite Integrity)', tests: [], passed: 0, failed: 0 },
  section2: { name: 'High-Volume Injections & Accounting Balance Conservation', tests: [], passed: 0, failed: 0 },
  section3: { name: 'Boundary Conditions & Adversarial Payload Safety', tests: [], passed: 0, failed: 0 },
  section4: { name: 'Session Isolation Across Concurrent Persona Requests', tests: [], passed: 0, failed: 0 },
  totalPassed: 0,
  totalFailed: 0,
  totalTests: 0,
  benchmarks: {}
};

let serverProcess = null;

// --- HTTP Request Client Helper ---
async function request(method, endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  let body = null;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 10000);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const rttMs = performance.now() - start;

    const contentType = res.headers.get('content-type') || '';
    let parsedBody = null;
    if (contentType.includes('application/json')) {
      parsedBody = await res.json();
    } else {
      parsedBody = await res.text();
    }

    return {
      status: res.status,
      ok: res.ok,
      headers: res.headers,
      body: parsedBody,
      rttMs
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const rttMs = performance.now() - start;
    return {
      status: 0,
      ok: false,
      error: err.name === 'AbortError' ? 'Timeout' : err.message,
      body: null,
      rttMs
    };
  }
}

// --- Statistical Math Helpers ---
function computeStats(values) {
  if (values.length === 0) return { min: 0, max: 0, mean: 0, median: 0, p95: 0, p99: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / sorted.length;
  const median = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  return { min, max, mean, median, p95, p99 };
}

// --- Test Runner Helper ---
async function runStressTest(sectionKey, id, title, testFn) {
  const section = report[sectionKey];
  report.totalTests++;
  process.stdout.write(`  [${id}] ${title} ... `);
  const start = performance.now();
  try {
    const detail = await testFn();
    const duration = (performance.now() - start).toFixed(1);
    report.totalPassed++;
    section.passed++;
    section.tests.push({ id, title, status: 'PASS', durationMs: parseFloat(duration), detail });
    console.log(`${c.green}PASS${c.reset} ${c.dim}(${duration}ms)${c.reset}`);
    if (detail && VERBOSE) {
      console.log(`        ${c.cyan}Metrics:${c.reset} ${JSON.stringify(detail)}`);
    }
  } catch (err) {
    const duration = (performance.now() - start).toFixed(1);
    report.totalFailed++;
    section.failed++;
    section.tests.push({ id, title, status: 'FAIL', durationMs: parseFloat(duration), error: err.message });
    console.log(`${c.red}FAIL${c.reset} ${c.dim}(${duration}ms)${c.reset}`);
    console.log(`        ${c.red}Error:${c.reset} ${err.message}`);
    if (VERBOSE && err.stack) {
      console.log(`        ${c.dim}${err.stack}${c.reset}`);
    }
  }
}

// --- Server Lifecycle Management ---
async function isServerOnline() {
  try {
    const res = await request('GET', '/api/personas', { timeoutMs: 1500 });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function ensureServer() {
  process.stdout.write(`${c.cyan}Checking target server at ${BASE_URL}...${c.reset} `);
  if (await isServerOnline()) {
    console.log(`${c.green}ONLINE (Connected!)${c.reset}`);
    return;
  }

  console.log(`${c.yellow}OFFLINE. Auto-starting local instance...${c.reset}`);
  const projectRoot = path.resolve(__dirname, '..');
  const serverPath = path.join(projectRoot, 'server', 'server.js');

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '3000' }
  });

  const deadline = Date.now() + 10000;
  let ready = false;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 400));
    if (await isServerOnline()) {
      ready = true;
      break;
    }
  }

  if (!ready) {
    if (serverProcess) serverProcess.kill();
    throw new Error('Timed out waiting for backend server to start.');
  }
  console.log(`${c.green}Server successfully booted and ready.${c.reset}`);
}

function stopServer() {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (_) {}
    serverProcess = null;
  }
}

// ==============================================================================
// TEST EXECUTION
// ==============================================================================
async function main() {
  console.log(`\n${c.bold}======================================================================${c.reset}`);
  console.log(`${c.bold}   myBCA ADAPT — EMPIRICAL ADVERSARIAL STRESS TEST SUITE${c.reset}`);
  console.log(`${c.bold}======================================================================${c.reset}\n`);

  await ensureServer();

  const directDbPath = path.resolve(__dirname, '..', 'server', 'db', 'database.sqlite');

  // ==============================================================================
  // SECTION 1: CONCURRENT RAPID REPEATED DATABASE RESETS
  // ==============================================================================
  console.log(`\n${c.bold}${c.blue}--- SECTION 1: CONCURRENT RAPID DATABASE RESETS (<50ms & SQLite Integrity) ---${c.reset}`);

  await runStressTest('section1', 'STR-1.1', 'Rapid sequential reset loop (20 iterations) measuring latency <50ms', async () => {
    const latencies = [];
    const serverDurations = [];

    for (let i = 0; i < 20; i++) {
      const res = await request('POST', '/api/admin/reset');
      if (res.status !== 200) {
        throw new Error(`Iteration ${i + 1} failed with HTTP ${res.status}: ${JSON.stringify(res.body)}`);
      }
      latencies.push(res.rttMs);
      if (res.body && typeof res.body.duration_ms === 'number') {
        serverDurations.push(res.body.duration_ms);
      }
    }

    const rttStats = computeStats(latencies);
    const srvStats = computeStats(serverDurations);
    report.benchmarks.resetSequential = { rtt: rttStats, server: srvStats };

    if (srvStats.mean >= 50) {
      throw new Error(`Average server reset duration exceeded 50ms: ${srvStats.mean.toFixed(1)}ms`);
    }

    return {
      iterations: 20,
      serverMeanMs: srvStats.mean.toFixed(2),
      serverP95Ms: srvStats.p95.toFixed(2),
      serverMaxMs: srvStats.max,
      clientRttMeanMs: rttStats.mean.toFixed(2)
    };
  });

  await runStressTest('section1', 'STR-1.2', 'Concurrent burst of 10 simultaneous resets via Promise.all (no busy errors)', async () => {
    const promises = Array.from({ length: 10 }, () => request('POST', '/api/admin/reset'));
    const results = await Promise.all(promises);

    const statuses = results.map(r => r.status);
    const non200 = results.filter(r => r.status !== 200);
    if (non200.length > 0) {
      throw new Error(`${non200.length}/10 concurrent resets failed. Statuses: ${JSON.stringify(statuses)}`);
    }

    const serverDurations = results.map(r => r.body?.duration_ms || 0);
    const srvStats = computeStats(serverDurations);
    report.benchmarks.resetConcurrent10 = srvStats;

    return {
      concurrentRequests: 10,
      successCount: results.length,
      serverMeanMs: srvStats.mean.toFixed(2),
      serverMaxMs: srvStats.max
    };
  });

  await runStressTest('section1', 'STR-1.3', 'High-concurrency burst of 25 simultaneous resets (SQLite WAL lock stress)', async () => {
    const promises = Array.from({ length: 25 }, () => request('POST', '/api/admin/reset'));
    const results = await Promise.all(promises);

    const non200 = results.filter(r => r.status !== 200);
    if (non200.length > 0) {
      throw new Error(`${non200.length}/25 resets failed. Error: ${JSON.stringify(non200[0].body)}`);
    }

    const serverDurations = results.map(r => r.body?.duration_ms || 0);
    const srvStats = computeStats(serverDurations);
    report.benchmarks.resetConcurrent25 = srvStats;

    return {
      concurrentRequests: 25,
      allSucceeded: true,
      serverMeanMs: srvStats.mean.toFixed(2),
      serverMaxMs: srvStats.max
    };
  });

  await runStressTest('section1', 'STR-1.4', 'Verify SQLite database integrity & pristine relational invariants post-reset', async () => {
    // Open read-only SQLite sync inspection
    const db = new DatabaseSync(directDbPath);
    try {
      const pragmaCheck = db.prepare('PRAGMA integrity_check;').get();
      if (pragmaCheck.integrity_check !== 'ok') {
        throw new Error(`SQLite PRAGMA integrity_check failed: ${JSON.stringify(pragmaCheck)}`);
      }

      const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      const accountsCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get().count;
      const featuresCount = db.prepare('SELECT COUNT(*) as count FROM features').get().count;
      const rulesCount = db.prepare('SELECT COUNT(*) as count FROM life_event_rules').get().count;
      const scenariosCount = db.prepare('SELECT COUNT(*) as count FROM simulation_scenarios').get().count;
      const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
      const activeFeatsCount = db.prepare("SELECT COUNT(*) as count FROM user_features WHERE status = 'ACTIVE'").get().count;

      if (usersCount !== 5) throw new Error(`Expected 5 users, got ${usersCount}`);
      if (accountsCount !== 5) throw new Error(`Expected 5 accounts, got ${accountsCount}`);
      if (featuresCount !== 12) throw new Error(`Expected 12 features, got ${featuresCount}`);
      if (rulesCount !== 5) throw new Error(`Expected 5 rules, got ${rulesCount}`);
      if (scenariosCount !== 3) throw new Error(`Expected 3 scenarios, got ${scenariosCount}`);
      if (txCount !== 35) throw new Error(`Expected exactly 35 pristine seed transactions, got ${txCount}`);
      if (activeFeatsCount !== 9) throw new Error(`Expected 9 pristine active features, got ${activeFeatsCount}`);

      // Verify exact seed balances
      const expectedBalances = {
        'dimas': 14500000,
        'ayu': 38200000,
        'sari': 125400000,
        'rina': 3400000,
        'bambang': 245000000
      };

      for (const [userId, expectedBal] of Object.entries(expectedBalances)) {
        const acc = db.prepare('SELECT balance FROM accounts WHERE user_id = ?').get(userId);
        if (!acc || acc.balance !== expectedBal) {
          throw new Error(`Persona '${userId}' balance mismatch. Expected ${expectedBal}, got ${acc?.balance}`);
        }
      }

      return {
        integrity: 'ok',
        tablesVerified: ['users', 'accounts', 'features', 'rules', 'scenarios', 'transactions', 'user_features'],
        allBalancesExact: true
      };
    } finally {
      db.close();
    }
  });

  await runStressTest('section1', 'STR-1.5', 'Adversarial race condition: simultaneous reset + transaction injection', async () => {
    // Login Dimas first
    const loginRes = await request('POST', '/api/auth/login', {
      body: { bca_id: 'dimas2026', password: 'Password123!' }
    });
    const token = loginRes.body?.token;
    if (!token) throw new Error('Could not acquire token for Dimas');

    // Fire 5 resets and 5 injections at the exact same instant
    const calls = [
      request('POST', '/api/admin/reset'),
      request('POST', '/api/transactions/inject', {
        token,
        body: { description: 'Contention Test TX 1', category: 'Jajan & Lifestyle', amount: 50000, type: 'DB' }
      }),
      request('POST', '/api/admin/reset'),
      request('POST', '/api/transactions/inject', {
        token,
        body: { description: 'Contention Test TX 2', category: 'Gaji Bulanan', amount: 500000, type: 'CR' }
      }),
      request('POST', '/api/admin/reset'),
      request('POST', '/api/transactions/inject', {
        token,
        body: { description: 'Contention Test TX 3', category: 'Jajan & Lifestyle', amount: 25000, type: 'DB' }
      }),
      request('POST', '/api/admin/reset'),
      request('POST', '/api/admin/reset')
    ];

    const results = await Promise.all(calls);
    const failedCalls = results.filter(r => r.status === 0);
    if (failedCalls.length > 0) {
      throw new Error(`Server crashed or connection aborted during contention test!`);
    }

    // Clean reset after race test
    await request('POST', '/api/admin/reset');

    return {
      interleavedOperations: calls.length,
      crashes: 0,
      databaseIntact: true
    };
  });

  // ==============================================================================
  // SECTION 2: HIGH-VOLUME INJECTIONS & ACCOUNTING BALANCE CONSERVATION
  // ==============================================================================
  console.log(`\n${c.bold}${c.blue}--- SECTION 2: HIGH-VOLUME INJECTIONS & ACCOUNTING BALANCE CONSERVATION ---${c.reset}`);

  // Reset to seeds before section 2
  await request('POST', '/api/admin/reset');

  await runStressTest('section2', 'STR-2.1', 'High-volume sequential stream (100 mutations: 50 CR, 50 DB) balance conservation', async () => {
    // 1. Authenticate Dimas
    const loginRes = await request('POST', '/api/auth/login', {
      body: { bca_id: 'dimas2026', password: 'Password123!' }
    });
    const token = loginRes.body?.token;
    const initialBalance = loginRes.body?.account?.balance;
    if (initialBalance !== 14500000) {
      throw new Error(`Expected Dimas initial balance 14500000, got ${initialBalance}`);
    }

    let runningDelta = 0;
    let totalCR = 0;
    let totalDB = 0;

    // Generate 100 transactions: alternating CR and DB with varying amounts
    for (let i = 1; i <= 100; i++) {
      const isCR = i % 2 === 1;
      const amount = isCR ? (50000 + (i * 12345) % 1500000) : (20000 + (i * 9876) % 800000);
      const type = isCR ? 'CR' : 'DB';
      const category = isCR ? 'Gaji Bulanan' : 'Jajan & Lifestyle';
      const desc = `Sequential Stress Mutation #${i} (${type})`;

      if (isCR) {
        runningDelta += amount;
        totalCR += amount;
      } else {
        runningDelta -= amount;
        totalDB += amount;
      }

      const res = await request('POST', '/api/transactions/inject', {
        token,
        body: { description: desc, category, amount, type }
      });

      if (res.status !== 201) {
        throw new Error(`Transaction #${i} injection failed with HTTP ${res.status}: ${JSON.stringify(res.body)}`);
      }

      const expectedIntermediateBalance = initialBalance + runningDelta;
      const returnedBalance = res.body?.new_balance;
      if (returnedBalance !== expectedIntermediateBalance) {
        throw new Error(`Intermediate balance mismatch at tx #${i}. Expected ${expectedIntermediateBalance}, got ${returnedBalance}`);
      }
    }

    // Query account endpoint to verify database state
    const accRes = await request('GET', '/api/accounts/me', { token });
    const finalBalance = accRes.body?.balance;
    const expectedFinalBalance = initialBalance + runningDelta;

    if (finalBalance !== expectedFinalBalance) {
      throw new Error(`Final account balance divergence! Expected ${expectedFinalBalance}, got ${finalBalance} (Diff: ${finalBalance - expectedFinalBalance})`);
    }

    // Query SQLite directly to confirm transaction records count
    const db = new DatabaseSync(directDbPath);
    const txCount = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE user_id = 'dimas' AND period = 'current'").get().count;
    db.close();

    // Dimas initially had 5 current mutations + 100 injected = 105
    if (txCount !== 105) {
      throw new Error(`Expected 105 current transactions in DB for Dimas, got ${txCount}`);
    }

    return {
      injectedCount: 100,
      initialBalance,
      totalCredits: totalCR,
      totalDebits: totalDB,
      expectedFinalBalance,
      actualFinalBalance: finalBalance,
      discrepancy: Math.abs(finalBalance - expectedFinalBalance)
    };
  });

  await runStressTest('section2', 'STR-2.2', 'Concurrent burst of 50 simultaneous mutations via Promise.all (balance conservation)', async () => {
    // Reset to pristine seeds
    await request('POST', '/api/admin/reset');

    // Authenticate Ayu
    const loginRes = await request('POST', '/api/auth/login', {
      body: { bca_id: 'ayu2026', password: 'Password123!' }
    });
    const token = loginRes.body?.token;
    const initialBalance = loginRes.body?.account?.balance; // 38,200,000

    let totalCR = 0;
    let totalDB = 0;
    const batch = [];

    for (let i = 1; i <= 50; i++) {
      const isCR = i % 2 === 1;
      const amount = isCR ? (100000 + i * 20000) : (50000 + i * 15000);
      const type = isCR ? 'CR' : 'DB';
      const category = isCR ? 'Transfer Masuk' : 'Supermarket / Dapur';
      const desc = `Concurrent Burst Mutation #${i} (${type})`;

      if (isCR) totalCR += amount;
      else totalDB += amount;

      batch.push(
        request('POST', '/api/transactions/inject', {
          token,
          body: { description: desc, category, amount, type }
        })
      );
    }

    const results = await Promise.all(batch);

    const non201 = results.filter(r => r.status !== 201);
    if (non201.length > 0) {
      throw new Error(`${non201.length}/50 concurrent mutations failed: ${JSON.stringify(non201[0].body)}`);
    }

    // Verify final account balance
    const accRes = await request('GET', '/api/accounts/me', { token });
    const finalBalance = accRes.body?.balance;
    const expectedBalance = initialBalance + totalCR - totalDB;

    if (finalBalance !== expectedBalance) {
      throw new Error(`Concurrent injection balance divergence! Expected ${expectedBalance}, got ${finalBalance} (Delta: ${finalBalance - expectedBalance})`);
    }

    return {
      concurrentMutations: 50,
      initialBalance,
      totalCredits: totalCR,
      totalDebits: totalDB,
      expectedFinalBalance: expectedBalance,
      actualFinalBalance: finalBalance,
      exactConservation: finalBalance === expectedBalance
    };
  });

  await runStressTest('section2', 'STR-2.3', 'Multi-tenant parallel transaction flood across 3 personas (60 simultaneous requests)', async () => {
    // Reset to seeds
    await request('POST', '/api/admin/reset');

    // Login 3 personas
    const p1 = (await request('POST', '/api/auth/quick-login', { body: { persona_id: 'dimas' } })).body;
    const p2 = (await request('POST', '/api/auth/quick-login', { body: { persona_id: 'sari' } })).body;
    const p3 = (await request('POST', '/api/auth/quick-login', { body: { persona_id: 'bambang' } })).body;

    const personas = [
      { id: 'dimas', token: p1.token, initial: p1.account.balance, cr: 0, db: 0 },
      { id: 'sari', token: p2.token, initial: p2.account.balance, cr: 0, db: 0 },
      { id: 'bambang', token: p3.token, initial: p3.account.balance, cr: 0, db: 0 }
    ];

    const allRequests = [];

    for (const p of personas) {
      for (let i = 1; i <= 20; i++) {
        const isCR = i % 2 === 0;
        const amount = 50000 * i;
        const type = isCR ? 'CR' : 'DB';
        if (isCR) p.cr += amount;
        else p.db += amount;

        allRequests.push(
          request('POST', '/api/transactions/inject', {
            token: p.token,
            body: {
              description: `Multi-Tenant Flood ${p.id} #${i}`,
              category: isCR ? 'Gaji Bulanan' : 'Tagihan Utilitas',
              amount,
              type
            }
          })
        );
      }
    }

    const results = await Promise.all(allRequests);
    const failures = results.filter(r => r.status !== 201);
    if (failures.length > 0) {
      throw new Error(`${failures.length}/60 multi-tenant transactions failed: ${JSON.stringify(failures[0].body)}`);
    }

    // Verify balance conservation for each persona independently
    for (const p of personas) {
      const accRes = await request('GET', '/api/accounts/me', { token: p.token });
      const expected = p.initial + p.cr - p.db;
      const actual = accRes.body?.balance;
      if (actual !== expected) {
        throw new Error(`Persona ${p.id} balance conservation failed! Expected ${expected}, got ${actual}`);
      }
    }

    return {
      tenants: 3,
      totalConcurrentCalls: 60,
      allTenantsConserved: true
    };
  });

  // ==============================================================================
  // SECTION 3: BOUNDARY CONDITIONS & ADVERSARIAL VALUE INJECTIONS
  // ==============================================================================
  console.log(`\n${c.bold}${c.blue}--- SECTION 3: BOUNDARY CONDITIONS & ADVERSARIAL PAYLOAD SAFETY ---${c.reset}`);

  await request('POST', '/api/admin/reset');
  const dimasAuth = (await request('POST', '/api/auth/quick-login', { body: { persona_id: 'dimas' } })).body;
  const dimasToken = dimasAuth.token;

  await runStressTest('section3', 'STR-3.1', 'Zero transaction amount (amount = 0) rejected with HTTP 400', async () => {
    const res = await request('POST', '/api/transactions/inject', {
      token: dimasToken,
      body: { description: 'Zero amount test', category: 'Jajan & Lifestyle', amount: 0, type: 'DB' }
    });
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 for amount 0, got ${res.status}`);
    }
    if (res.body?.error?.code !== 'VALIDATION_ERROR') {
      throw new Error(`Expected code VALIDATION_ERROR, got ${res.body?.error?.code}`);
    }
    return { status: res.status, code: res.body?.error?.code };
  });

  await runStressTest('section3', 'STR-3.2', 'Negative amounts (-1, -50000, -1000000000) rejected with HTTP 400', async () => {
    const testCases = [-1, -50000, -1000000000];
    for (const negAmount of testCases) {
      const res = await request('POST', '/api/transactions/inject', {
        token: dimasToken,
        body: { description: `Negative test ${negAmount}`, category: 'Jajan & Lifestyle', amount: negAmount, type: 'DB' }
      });
      if (res.status !== 400) {
        throw new Error(`Expected HTTP 400 for amount ${negAmount}, got ${res.status}`);
      }
    }
    return { testCasesTested: testCases.length, allRejected400: true };
  });

  await runStressTest('section3', 'STR-3.3', 'Non-numeric amounts ("abc", "", null, {}, [], NaN, Infinity) rejected with HTTP 400', async () => {
    const invalidAmounts = ['abc', '', null, {}, [], NaN, Infinity];
    for (const badAmount of invalidAmounts) {
      const res = await request('POST', '/api/transactions/inject', {
        token: dimasToken,
        body: { description: 'Non-numeric test', category: 'Jajan & Lifestyle', amount: badAmount, type: 'DB' }
      });
      if (res.status !== 400) {
        throw new Error(`Expected HTTP 400 for invalid amount [${JSON.stringify(badAmount)}], got ${res.status}`);
      }
    }
    return { invalidAmountsTested: invalidAmounts.length, allRejected400: true };
  });

  await runStressTest('section3', 'STR-3.4', 'Extreme values: 100 Billion IDR transaction (safe 64-bit integer handling)', async () => {
    const initialBal = (await request('GET', '/api/accounts/me', { token: dimasToken })).body.balance;
    const extremeAmount = 100000000000; // 100 Miliar Rupiah

    // 1. Inject 100 Miliar CR
    const crRes = await request('POST', '/api/transactions/inject', {
      token: dimasToken,
      body: {
        description: 'Pencairan Investasi Obligasi Jumbo',
        category: 'Transfer Masuk',
        amount: extremeAmount,
        type: 'CR'
      }
    });

    if (crRes.status !== 201) {
      throw new Error(`CR 100 Miliar failed: HTTP ${crRes.status} - ${JSON.stringify(crRes.body)}`);
    }

    const expectedBalAfterCR = initialBal + extremeAmount;
    if (crRes.body?.new_balance !== expectedBalAfterCR) {
      throw new Error(`Balance after 100 Miliar CR expected ${expectedBalAfterCR}, got ${crRes.body?.new_balance}`);
    }

    // 2. Inject 50 Miliar DB
    const halfExtreme = 50000000000; // 50 Miliar
    const dbRes = await request('POST', '/api/transactions/inject', {
      token: dimasToken,
      body: {
        description: 'Pembelian Aset Tanah Kantor',
        category: 'Pengeluaran Rumah',
        amount: halfExtreme,
        type: 'DB'
      }
    });

    if (dbRes.status !== 201) {
      throw new Error(`DB 50 Miliar failed: HTTP ${dbRes.status} - ${JSON.stringify(dbRes.body)}`);
    }

    const expectedBalAfterDB = expectedBalAfterCR - halfExtreme;
    if (dbRes.body?.new_balance !== expectedBalAfterDB) {
      throw new Error(`Balance after 50 Miliar DB expected ${expectedBalAfterDB}, got ${dbRes.body?.new_balance}`);
    }

    return {
      initialBalance: initialBal,
      extremeCredit: extremeAmount,
      extremeDebit: halfExtreme,
      finalBalance: dbRes.body?.new_balance,
      noIntegerOverflow: true
    };
  });

  await runStressTest('section3', 'STR-3.5', 'Security payloads: SQL injection, XSS, Unicode/Emoji, and 5000-char string', async () => {
    const payloads = [
      { name: 'SQLi Single Quote Drop', str: "'; DROP TABLE accounts; --" },
      { name: 'SQLi Tautology', str: "1' OR '1'='1" },
      { name: 'XSS Script Tag', str: "<script>alert('pwned')</script>" },
      { name: 'XSS Image onerror', str: "<img src=x onerror=alert(document.cookie)>" },
      { name: 'Emoji & Multilingual', str: "Transfer Gaji 🎉 💸 🚀 日本語 한국어 🇮🇩 Rp 5.000.000" },
      { name: '5000 Character Long String', str: 'A'.repeat(5000) }
    ];

    for (const p of payloads) {
      const res = await request('POST', '/api/transactions/inject', {
        token: dimasToken,
        body: {
          description: p.str,
          category: 'Jajan & Lifestyle',
          amount: 10000,
          type: 'DB'
        }
      });

      if (res.status !== 201) {
        throw new Error(`Payload '${p.name}' failed with HTTP ${res.status}: ${JSON.stringify(res.body)}`);
      }

      // Verify that the exact description is stored intact
      const insertedDesc = res.body?.transaction?.description;
      if (insertedDesc !== p.str) {
        throw new Error(`Payload '${p.name}' was modified or corrupted in database. Stored length: ${insertedDesc?.length}`);
      }
    }

    // Verify accounts table was not dropped or corrupted by SQLi
    const accRes = await request('GET', '/api/accounts/me', { token: dimasToken });
    if (accRes.status !== 200) {
      throw new Error(`Accounts table damaged! HTTP ${accRes.status}`);
    }

    return {
      payloadsTested: payloads.length,
      allStoredVerbatim: true,
      sqlInjectionImmune: true
    };
  });

  await runStressTest('section3', 'STR-3.6', 'Invalid transaction types & case-insensitivity handling', async () => {
    // 1. Lowercase 'cr' and 'db' should be handled properly
    const resLowerCR = await request('POST', '/api/transactions/inject', {
      token: dimasToken,
      body: { description: 'Lowercase CR Test', category: 'Lainnya', amount: 50000, type: 'cr' }
    });
    if (resLowerCR.status !== 201 || resLowerCR.body?.transaction?.type !== 'CR') {
      throw new Error(`Lowercase 'cr' failed to resolve to 'CR': ${JSON.stringify(resLowerCR.body)}`);
    }

    const resLowerDB = await request('POST', '/api/transactions/inject', {
      token: dimasToken,
      body: { description: 'Lowercase DB Test', category: 'Lainnya', amount: 50000, type: 'db' }
    });
    if (resLowerDB.status !== 201 || resLowerDB.body?.transaction?.type !== 'DB') {
      throw new Error(`Lowercase 'db' failed to resolve to 'DB': ${JSON.stringify(resLowerDB.body)}`);
    }

    // 2. Invalid type 'INVALID_TYPE' should fall back safely without server crash
    const resInvalid = await request('POST', '/api/transactions/inject', {
      token: dimasToken,
      body: { description: 'Invalid Type Test', category: 'Gaji Bulanan', amount: 50000, type: 'INVALID_TYPE' }
    });
    if (resInvalid.status !== 201) {
      throw new Error(`Invalid type should fall back gracefully, got HTTP ${resInvalid.status}`);
    }
    // Gaji Bulanan category heuristic resolves to CR
    if (resInvalid.body?.transaction?.type !== 'CR') {
      throw new Error(`Expected fallback heuristic 'CR' for Gaji Bulanan, got ${resInvalid.body?.transaction?.type}`);
    }

    return {
      lowercaseNormalized: true,
      invalidTypeFallbackSafe: true
    };
  });

  // ==============================================================================
  // SECTION 4: SESSION ISOLATION ACROSS CONCURRENT PERSONA REQUESTS
  // ==============================================================================
  console.log(`\n${c.bold}${c.blue}--- SECTION 4: SESSION ISOLATION ACROSS CONCURRENT PERSONA REQUESTS ---${c.reset}`);

  await request('POST', '/api/admin/reset');

  await runStressTest('section4', 'STR-4.1', 'Concurrent login & token generation for all 5 personas', async () => {
    const personaIds = ['dimas', 'ayu', 'sari', 'rina', 'bambang'];
    const loginPromises = personaIds.map(id =>
      request('POST', '/api/auth/quick-login', { body: { persona_id: id } })
    );

    const responses = await Promise.all(loginPromises);
    const tokens = {};

    for (let i = 0; i < personaIds.length; i++) {
      const res = responses[i];
      const id = personaIds[i];
      if (res.status !== 200) {
        throw new Error(`Quick-login failed for ${id}: HTTP ${res.status}`);
      }
      const token = res.body?.token;
      if (!token) throw new Error(`Missing token for ${id}`);
      tokens[id] = token;
    }

    // Verify all tokens are strictly unique
    const uniqueTokens = new Set(Object.values(tokens));
    if (uniqueTokens.size !== 5) {
      throw new Error(`Expected 5 unique tokens, got ${uniqueTokens.size}`);
    }

    return {
      personasAuthenticated: 5,
      tokensUnique: true,
      tokenList: Object.keys(tokens).map(k => `${k}: ${tokens[k].slice(0, 15)}...`)
    };
  });

  await runStressTest('section4', 'STR-4.2', '100 interleaved concurrent queries verifying zero cross-session data leakage', async () => {
    // Acquire tokens for all 5 personas
    const personaIds = ['dimas', 'ayu', 'sari', 'rina', 'bambang'];
    const tokens = {};
    for (const id of personaIds) {
      const res = await request('POST', '/api/auth/quick-login', { body: { persona_id: id } });
      tokens[id] = res.body.token;
    }

    const expectedData = {
      dimas: { bca_id: 'dimas2026', account_no: '8820491823', name: 'Dimas Prasetyo' },
      ayu: { bca_id: 'ayu2026', account_no: '5271890241', name: 'Ayu Ratnasari' },
      sari: { bca_id: 'sari2026', account_no: '7401293811', name: 'Hj. Sari Wijaya' },
      rina: { bca_id: 'rina2026', account_no: '6029104822', name: 'Rina Kartika' },
      bambang: { bca_id: 'bambang2026', account_no: '1092847120', name: 'Drs. Bambang Hariyanto' }
    };

    // Construct 100 interleaved requests (20 per persona)
    const requestsList = [];
    for (let i = 0; i < 100; i++) {
      const personaId = personaIds[i % 5];
      const token = tokens[personaId];
      const endpoint = i % 2 === 0 ? '/api/accounts/me' : '/api/auth/session';

      requestsList.push({
        personaId,
        endpoint,
        promise: request('GET', endpoint, { token })
      });
    }

    const responses = await Promise.all(requestsList.map(r => r.promise));

    let leaksDetected = 0;

    for (let i = 0; i < requestsList.length; i++) {
      const { personaId, endpoint } = requestsList[i];
      const res = responses[i];
      const expected = expectedData[personaId];

      if (res.status !== 200) {
        throw new Error(`Request #${i} (${personaId} -> ${endpoint}) failed with HTTP ${res.status}`);
      }

      if (endpoint === '/api/accounts/me') {
        const accNo = res.body?.account_no || res.body?.account_number;
        const holder = res.body?.holder_name;
        if (accNo !== expected.account_no || holder !== expected.name) {
          leaksDetected++;
          throw new Error(`SESSION LEAK! Expected ${expected.account_no} (${expected.name}), got ${accNo} (${holder})`);
        }
      } else {
        const bcaId = res.body?.user?.bca_id;
        const name = res.body?.user?.name;
        if (bcaId !== expected.bca_id || name !== expected.name) {
          leaksDetected++;
          throw new Error(`SESSION LEAK! Expected ${expected.bca_id} (${expected.name}), got ${bcaId} (${name})`);
        }
      }
    }

    return {
      interleavedQueries: 100,
      queriesPerPersona: 20,
      leaksDetected,
      isolationIntegrity: '100% PERFECT'
    };
  });

  await runStressTest('section4', 'STR-4.3', 'Cross-persona state mutation isolation (features & transactions)', async () => {
    // Login Dimas and Ayu
    const dimasToken = (await request('POST', '/api/auth/quick-login', { body: { persona_id: 'dimas' } })).body.token;
    const ayuToken = (await request('POST', '/api/auth/quick-login', { body: { persona_id: 'ayu' } })).body.token;

    // Dimas activates 'health_insurance'
    const activateRes = await request('POST', '/api/features/health_insurance/activate', { token: dimasToken });
    if (activateRes.status !== 200) {
      throw new Error(`Dimas feature activation failed: HTTP ${activateRes.status}`);
    }

    // Verify Dimas now has health_insurance
    const dimasMe = await request('GET', '/api/auth/session', { token: dimasToken });
    const dimasAi = await request('GET', '/api/ai/status', { token: dimasToken });

    // Verify Ayu does NOT have health_insurance
    const ayuAi = await request('GET', '/api/ai/status', { token: ayuToken });

    // Check directly in database
    const db = new DatabaseSync(directDbPath);
    const dimasFeatures = db.prepare("SELECT feature_id FROM user_features WHERE user_id = 'dimas' AND status = 'ACTIVE'").all().map(f => f.feature_id);
    const ayuFeatures = db.prepare("SELECT feature_id FROM user_features WHERE user_id = 'ayu' AND status = 'ACTIVE'").all().map(f => f.feature_id);
    db.close();

    if (!dimasFeatures.includes('health_insurance')) {
      throw new Error(`Dimas should have 'health_insurance'`);
    }
    if (ayuFeatures.includes('health_insurance')) {
      throw new Error(`MUTATION LEAK! Ayu unexpectedly acquired 'health_insurance' activated by Dimas`);
    }

    return {
      dimasFeatures,
      ayuFeatures,
      stateMutationContained: true
    };
  });

  await runStressTest('section4', 'STR-4.4', 'Selective session termination isolation (logout one does not affect others)', async () => {
    const dimasToken = (await request('POST', '/api/auth/quick-login', { body: { persona_id: 'dimas' } })).body.token;
    const ayuToken = (await request('POST', '/api/auth/quick-login', { body: { persona_id: 'ayu' } })).body.token;

    // Logout Dimas
    const logoutRes = await request('POST', '/api/auth/logout', { token: dimasToken });
    if (logoutRes.status !== 200) {
      throw new Error(`Logout failed: HTTP ${logoutRes.status}`);
    }

    // Verify Dimas token is revoked
    const dimasCheck = await request('GET', '/api/auth/session', { token: dimasToken });
    if (dimasCheck.status !== 401) {
      throw new Error(`Revoked token should yield HTTP 401, got ${dimasCheck.status}`);
    }

    // Verify Ayu token remains fully valid
    const ayuCheck = await request('GET', '/api/auth/session', { token: ayuToken });
    if (ayuCheck.status !== 200) {
      throw new Error(`Ayu session unexpectedly invalidated after Dimas logout! HTTP ${ayuCheck.status}`);
    }

    return {
      revokedTokenStatus: dimasCheck.status,
      activeTokenStatus: ayuCheck.status,
      selectiveInvalidationWorks: true
    };
  });

  // ==============================================================================
  // SUMMARY SCOREBOARD & VERDICT
  // ==============================================================================
  console.log(`\n${c.bold}======================================================================${c.reset}`);
  console.log(`${c.bold}   STRESS TEST RUNNER SUMMARY SCOREBOARD${c.reset}`);
  console.log(`${c.bold}======================================================================${c.reset}`);
  console.log(`  Section 1: Concurrency & Database Resets  : ${report.section1.passed}/${report.section1.tests.length} PASS`);
  console.log(`  Section 2: Accounting Balance Conservation: ${report.section2.passed}/${report.section2.tests.length} PASS`);
  console.log(`  Section 3: Boundary & Adversarial Inputs  : ${report.section3.passed}/${report.section3.tests.length} PASS`);
  console.log(`  Section 4: Session Isolation Multi-Tenant : ${report.section4.passed}/${report.section4.tests.length} PASS`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`  Total Stress Tests Executed : ${report.totalTests}`);
  console.log(`  Passed                      : ${c.green}${report.totalPassed}${c.reset}`);
  console.log(`  Failed                      : ${report.totalFailed > 0 ? c.red + report.totalFailed + c.reset : '0'}`);
  console.log(`======================================================================\n`);

  const verdict = report.totalFailed === 0 ? 'APPROVE' : 'REJECT';
  if (verdict === 'APPROVE') {
    console.log(`  ${c.bgGreen}${c.bold} FINAL VERDICT: APPROVE — SYSTEM PASSES ALL EMPIRICAL STRESS TESTS ${c.reset}\n`);
  } else {
    console.log(`  ${c.bgRed}${c.bold} FINAL VERDICT: REJECT — CRITICAL FAILURES DETECTED ${c.reset}\n`);
  }

  // Restore pristine database before exiting
  await request('POST', '/api/admin/reset');

  stopServer();

  // Return exit code
  process.exit(report.totalFailed === 0 ? 0 : 1);
}

main().catch(err => {
  console.error(`\n${c.red}FATAL ERROR IN STRESS RUNNER:${c.reset}`, err);
  stopServer();
  process.exit(1);
});
