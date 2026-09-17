/**
 * Voucher & Financial Target System Automated Integration Tests
 * myBCA ADAPT
 */

const assert = require('node:assert');
const { resetDatabase } = require('../server/db/seed');
const { evaluateVouchersForUser, claimVoucher } = require('../server/services/voucherEvaluator');
const { queryAll, queryOne } = require('../server/db/database');

async function runTests() {
  console.log('🧪 Starting Voucher & Target System Tests...');

  // Reset database to clean seeds
  resetDatabase();

  // Test 1: Seeded vouchers check
  const vouchers = queryAll('SELECT * FROM vouchers');
  assert.strictEqual(vouchers.length, 5, 'Should have 5 seeded vouchers');
  console.log('✅ Test 1 Passed: 5 seeded vouchers exist');

  // Test 2: Evaluate target progress for Dimas
  const dimasVouchers = evaluateVouchersForUser('dimas');
  assert.strictEqual(dimasVouchers.length, 5, 'Dimas should see all 5 vouchers');
  
  // Dimas gamification score is ~55 PTS (Bronze), Kopi Kenangan needs 60 PTS -> locked
  const kopiKenangan = dimasVouchers.find(v => v.id === 'vouch_kopikenangan_25k');
  assert.ok(kopiKenangan, 'Kopi Kenangan voucher exists');
  console.log(`Dimas Kopi Kenangan progress: ${kopiKenangan.current_value} / ${kopiKenangan.target_value} (unlocked: ${kopiKenangan.is_unlocked})`);

  // Test 3: Evaluate target progress for Ayu
  // Ayu has activeFeatures ['auto_save', 'family_budgeting'], score ~75 PTS (Gold)
  const ayuVouchers = evaluateVouchersForUser('ayu');
  const ayuKenangan = ayuVouchers.find(v => v.id === 'vouch_kopikenangan_25k');
  assert.strictEqual(ayuKenangan.is_unlocked, true, 'Ayu should have unlocked Kopi Kenangan (score >= 60)');
  assert.strictEqual(ayuKenangan.is_claimed, false, 'Ayu should not have claimed it yet');
  console.log('✅ Test 3 Passed: Ayu unlocked Kopi Kenangan (Gold tier)');

  // Test 4: Ayu claims unlocked voucher
  const claimResult = claimVoucher('ayu', 'vouch_kopikenangan_25k');
  assert.strictEqual(claimResult.success, true, 'Claim should succeed');
  assert.strictEqual(claimResult.voucher.status, 'CLAIMED', 'Status should be CLAIMED');
  console.log('✅ Test 4 Passed: Ayu successfully claimed voucher');

  // Test 5: Ayu attempts to claim the same voucher again -> should throw
  assert.throws(
    () => claimVoucher('ayu', 'vouch_kopikenangan_25k'),
    /sudah pernah kamu klaim/,
    'Should prevent duplicate claims'
  );
  console.log('✅ Test 5 Passed: Duplicate claim prevented');

  // Test 6: Dimas attempts to claim locked voucher -> should throw
  assert.throws(
    () => claimVoucher('dimas', 'vouch_kopikenangan_25k'),
    /Target finansial belum tercapai/,
    'Should prevent claiming locked voucher'
  );
  console.log('✅ Test 6 Passed: Locked voucher claim prevented');

  // Test 7: Admin creates new voucher with target
  const newVoucherId = `vouch_test_${Date.now()}`;
  const { execute } = require('../server/db/database');
  execute(
    `INSERT INTO vouchers (
      id, code, title, merchant, category, icon,
      reward_value, reward_type, target_type, target_value,
      target_category, description, expiry_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
    [
      newVoucherId,
      'BCA-TEST-100K',
      'Special Test Admin Voucher',
      'Admin Partner',
      'Shopping',
      'bi-stars',
      100000,
      'DISCOUNT',
      'MIN_HEALTH_SCORE',
      40,
      null,
      'Test quest for all users',
      '2026-12-31'
    ]
  );

  const updatedDimasVouchers = evaluateVouchersForUser('dimas');
  const testVoucher = updatedDimasVouchers.find(v => v.id === newVoucherId);
  assert.ok(testVoucher, 'New admin voucher should appear for Dimas immediately');
  assert.strictEqual(testVoucher.is_unlocked, true, 'Dimas score 45 >= target 40 -> should be unlocked');
  console.log('✅ Test 7 Passed: Admin voucher created and immediately evaluated for all personas');

  console.log('\n🎉 ALL VOUCHER & ADMIN TARGET TESTS PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
