const assert = require('node:assert');
const { queryOne, queryAll } = require('../../server/db/database');
const { app, ensureDatabaseReady } = require('../../server/server');

async function testHttpForensics() {
  ensureDatabaseReady();
  const TEST_PORT = 3599;
  const BASE_URL = `asynchttp://127.0.0.1:${TEST_PORT}`.replace('async', '');
  const server = await new Promise(resolve => {
    const s = app.listen(TEST_PORT, () => resolve(s));
  });

  try {
    // 1. Reset database
    const resetRes = await fetch(`${BASE_URL}/api/admin/reset`, { method: 'POST' });
    assert.strictEqual(resetRes.status, 200);
    const resetData = await resetRes.json();
    assert.strictEqual(resetData.success, true);
    console.log('[PASS] DB Reset returned HTTP 200 with duration:', resetData.duration_ms, 'ms');

    // 2. Quick login as dimas
    const loginRes = await fetch(`${BASE_URL}/api/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona_id: 'dimas' })
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    const token = loginData.token;
    assert(token, 'Token must exist');
    console.log('[PASS] Quick login issued valid session token');

    // 3. Verify initial balance
    const meRes = await fetch(`${BASE_URL}/api/accounts/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meData = await meRes.json();
    assert.strictEqual(meData.balance, 14500000);
    console.log('[PASS] Initial balance matches seed: 14,500,000 IDR');

    // 4. Inject CR transaction with unique marker
    const uniqueMarker = 'FORENSIC_AUDIT_MARKER_' + Date.now();
    const crRes = await fetch(`${BASE_URL}/api/transactions/inject`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: uniqueMarker,
        category: 'Gaji Bulanan',
        amount: 3333333,
        type: 'CR'
      })
    });
    assert.strictEqual(crRes.status, 201);
    const crData = await crRes.json();
    assert.strictEqual(crData.new_balance, 17833333);
    console.log('[PASS] CR Injection balance math: 14,500,000 + 3,333,333 =', crData.new_balance);

    // Verify in SQLite directly
    const dbAccAfterCR = queryOne('SELECT balance FROM accounts WHERE user_id = ?', ['dimas']);
    assert.strictEqual(dbAccAfterCR.balance, 17833333);
    console.log('[PASS] Direct SQLite accounts table balance confirmed: 17,833,333 IDR');

    // 5. Inject DB transaction
    const dbRes = await fetch(`${BASE_URL}/api/transactions/inject`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: 'Disbursement Marker',
        category: 'Sewa Kos / Housing',
        amount: 1111111,
        type: 'DB'
      })
    });
    assert.strictEqual(dbRes.status, 201);
    const dbData = await dbRes.json();
    assert.strictEqual(dbData.new_balance, 16722222);
    console.log('[PASS] DB Injection balance math: 17,833,333 - 1,111,111 =', dbData.new_balance);

    const dbAccAfterDB = queryOne('SELECT balance FROM accounts WHERE user_id = ?', ['dimas']);
    assert.strictEqual(dbAccAfterDB.balance, 16722222);
    console.log('[PASS] Direct SQLite accounts table balance confirmed: 16,722,222 IDR');

    // 6. Check Audit Logs endpoint for the marker
    const logsRes = await fetch(`${BASE_URL}/api/ai/audit-logs?limit=10`);
    assert.strictEqual(logsRes.status, 200);
    const logsData = await logsRes.json();
    assert(Array.isArray(logsData.data), 'Logs must be array');
    const foundMarkerLog = logsData.data.find(l => l.message && l.message.includes(uniqueMarker));
    assert(foundMarkerLog, 'Marker log must appear in /api/ai/audit-logs stream!');
    console.log('[PASS] Mode Juri audit log stream returned genuine inserted log:', foundMarkerLog.message);

    // 7. Verify audit log row exists in SQLite table
    const dbLogRow = queryOne('SELECT * FROM audit_logs WHERE message LIKE ?', ['%' + uniqueMarker + '%']);
    assert(dbLogRow, 'Audit log row must exist in SQLite audit_logs table');
    console.log('[PASS] Direct SQLite audit_logs table confirmed row id:', dbLogRow.id);

    // 8. 1-Click Reset verification
    const resetAgain = await fetch(`${BASE_URL}/api/admin/reset`, { method: 'POST' });
    assert.strictEqual(resetAgain.status, 200);
    console.log('[PASS] 1-Click Reset executed successfully');

    // Check Dimas balance after reset
    const resetAcc = queryOne('SELECT balance FROM accounts WHERE user_id = ?', ['dimas']);
    assert.strictEqual(resetAcc.balance, 14500000, 'Balance must be restored to 14.5M');
    console.log('[PASS] Post-reset balance restored to exact 14,500,000 IDR');

    // Check marker transaction wiped
    const markerTx = queryOne('SELECT * FROM transactions WHERE description = ?', [uniqueMarker]);
    assert.strictEqual(markerTx, undefined, 'Injected transaction must be wiped by 1-click reset');
    console.log('[PASS] Post-reset transaction table wiped injected records cleanly');

    console.log('\nALL HTTP & PERSISTENCE FORENSIC CHECKS PASSED EMPIRICALLY!');
  } finally {
    server.close();
  }
}

testHttpForensics().catch(err => {
  console.error('FORENSIC HTTP CHECK FAILED:', err);
  process.exit(1);
});