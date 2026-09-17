/**
 * Test Feature Onboarding & Initial Balance Setting Flow
 */

const assert = require('assert');

async function run() {
  console.log('Testing Feature Onboarding & Saldo Setting Flow...');

  // 1. Reset database
  const resetRes = await fetch('http://localhost:3000/api/admin/reset', { method: 'POST' }).then(r => r.json());
  assert.strictEqual(resetRes.success, true);
  console.log('✓ Reset to pristine seeds successful');

  // 2. Login as Dimas
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bca_id: 'DIMAS2026', password: 'Password123!' })
  }).then(r => r.json());
  assert.strictEqual(loginRes.success, true);
  const token = loginRes.token;
  console.log('✓ Login as Dimas successful (Initial Balance:', loginRes.account.balance, ')');

  // 3. GET Onboarding catalog for Investasi (conservative_invest)
  const obRes = await fetch('http://localhost:3000/api/features/conservative_invest/onboarding', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(r => r.json());
  assert.strictEqual(obRes.success, true);
  assert.ok(obRes.data.onboarding.products.length >= 3);
  assert.strictEqual(obRes.data.onboarding.requires_initial_balance, true);
  assert.strictEqual(obRes.data.source_account.balance, 14500000);
  console.log('✓ Onboarding details fetched. Products count:', obRes.data.onboarding.products.length);

  // 4. Test Insufficient Balance Error (try activating with 50,000,000)
  const failRes = await fetch('http://localhost:3000/api/features/conservative_invest/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({
      initial_amount: 50000000,
      product_name: 'BCA Reksa Dana Pasar Uang Prima',
      product_id: 'bca_pu_prima'
    })
  });
  assert.strictEqual(failRes.status, 400);
  const failData = await failRes.json();
  assert.strictEqual(failData.error.code, 'INSUFFICIENT_BALANCE');
  console.log('✓ Insufficient balance properly rejected with HTTP 400:', failData.error.message);

  // 5. Test Successful Onboarding Activation with 500,000 initial balance
  const actRes = await fetch('http://localhost:3000/api/features/conservative_invest/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({
      initial_amount: 500000,
      product_name: 'BCA Reksa Dana Pasar Uang Prima',
      product_id: 'bca_pu_prima'
    })
  }).then(r => r.json());

  assert.strictEqual(actRes.success, true);
  assert.strictEqual(actRes.points_awarded, 20);
  assert.strictEqual(actRes.new_balance, 14000000);
  assert.strictEqual(actRes.transaction.category, 'Investasi & Deposito');
  assert.strictEqual(actRes.transaction.amount, 500000);
  assert.strictEqual(actRes.transaction.type, 'DB');
  assert.ok(actRes.receipt.reference_no.startsWith('REF-BCA'));
  assert.strictEqual(actRes.receipt.status, 'BERHASIL');
  console.log('✓ Activation successful with receipt REF:', actRes.receipt.reference_no);
  console.log('✓ Account debited from 14.500.000 to', actRes.new_balance);
  console.log('✓ Gamification score rose from', actRes.gamification_score.previous_score, 'to', actRes.gamification_score.new_score);

  // 6. Test Auto-Save onboarding flow (auto_save)
  const saveObRes = await fetch('http://localhost:3000/api/features/auto_save/onboarding', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(r => r.json());
  assert.strictEqual(saveObRes.success, true);
  assert.ok(saveObRes.data.onboarding.products.length >= 2);
  console.log('✓ Auto-Save onboarding catalog verified.');

  // 7. Reset back to initial seeds
  await fetch('http://localhost:3000/api/admin/reset', { method: 'POST' });
  console.log('✓ Database restored to pristine seeds for demo readiness.');

  console.log('\n ALL FEATURE ONBOARDING TESTS PASSED (100%) \n');
}

run().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
