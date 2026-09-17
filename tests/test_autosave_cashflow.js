/**
 * Test Auto-Save Cashflow & Anti-Meleset Calculation Engine
 */

const assert = require('assert');

async function run() {
  console.log('Testing Auto-Save Cashflow & Anti-Meleset Calculation...');

  // 1. Reset database
  await fetch('http://localhost:3000/api/admin/reset', { method: 'POST' });

  // 2. Login as Dimas
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bca_id: 'DIMAS2026', password: 'Password123!' })
  }).then(r => r.json());
  assert.strictEqual(loginRes.success, true);
  const token = loginRes.token;

  // 3. GET Onboarding for Auto-Save
  const obRes = await fetch('http://localhost:3000/api/features/auto_save/onboarding', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(r => r.json());
  assert.strictEqual(obRes.success, true);

  const cashflow = obRes.data.cashflow_analysis;
  assert.ok(cashflow, 'Cashflow analysis must exist in payload');
  console.log('✓ Cashflow analysis retrieved successfully:');
  console.log('  - Rata-rata Pengeluaran Bulanan:', cashflow.average_monthly_expense.toLocaleString('id-ID'));
  console.log('  - Pemasukan Bulanan:', cashflow.average_monthly_income.toLocaleString('id-ID'));
  console.log('  - Surplus Kas Bersih:', cashflow.net_surplus.toLocaleString('id-ID'));
  console.log('  - Rekomendasi Optimal (15%):', cashflow.recommendations.optimal.toLocaleString('id-ID'));
  console.log('  - Batas Aman Anti-Meleset:', cashflow.recommendations.max_safe_limit.toLocaleString('id-ID'));
  console.log('  - Target Dana Darurat 3x:', cashflow.emergency_fund.target_3x.toLocaleString('id-ID'));

  assert.strictEqual(cashflow.average_monthly_expense, 3400000);
  assert.strictEqual(cashflow.net_surplus, 5100000);
  assert.ok(cashflow.recommendations.optimal >= 850000);

  // 4. Activate Auto-Save with calculated optimal amount (e.g. 1,300,000)
  const actRes = await fetch('http://localhost:3000/api/features/auto_save/activate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      initial_amount: cashflow.recommendations.optimal,
      product_name: 'Kantong Dana Darurat (Auto-Save)',
      product_id: 'kantong_dana_darurat'
    })
  }).then(r => r.json());

  assert.strictEqual(actRes.success, true);
  assert.strictEqual(actRes.initial_amount, cashflow.recommendations.optimal);
  assert.strictEqual(actRes.new_balance, 14500000 - cashflow.recommendations.optimal);
  console.log('✓ Auto-Save activated with optimal amount:', cashflow.recommendations.optimal.toLocaleString('id-ID'));
  console.log('✓ New Account Balance:', actRes.new_balance.toLocaleString('id-ID'));

  // 5. Reset back to pristine seeds
  await fetch('http://localhost:3000/api/admin/reset', { method: 'POST' });
  console.log('✓ Database restored to pristine seed state.');

  console.log('\n ALL AUTO-SAVE CASHFLOW TESTS PASSED (100%) \n');
}

run().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
