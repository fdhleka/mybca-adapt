/**
 * Simulation Scenarios Routes
 * myBCA ADAPT
 */

const express = require('express');
const router = express.Router();
const { queryAll, queryOne, transaction } = require('../db/database');

/**
 * GET /api/simulation/scenarios
 * Returns all 3 preset presentation scenarios
 */
router.get('/scenarios', (req, res) => {
  const scenarios = queryAll('SELECT * FROM simulation_scenarios ORDER BY id ASC');
  const parsed = scenarios.map(s => ({
    ...s,
    payload_transactions: typeof s.payload_transactions === 'string'
      ? JSON.parse(s.payload_transactions)
      : s.payload_transactions
  }));

  res.json({
    success: true,
    data: parsed
  });
});

/**
 * POST /api/simulation/scenarios/:id/trigger
 * Triggers a preset scenario, injecting transactions and mutating account balance
 */
router.post('/scenarios/:id/trigger', (req, res) => {
  const scenarioId = req.params.id;
  const scenario = queryOne('SELECT * FROM simulation_scenarios WHERE id = ?', [scenarioId]);

  if (!scenario) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'SCENARIO_NOT_FOUND',
        message: `Skenario '${scenarioId}' tidak ditemukan.`
      }
    });
  }

  const account = queryOne('SELECT * FROM accounts WHERE user_id = ? LIMIT 1', [scenario.persona_id]);
  if (!account) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ACCOUNT_NOT_FOUND',
        message: `Rekening untuk persona '${scenario.persona_id}' tidak ditemukan.`
      }
    });
  }

  const txList = typeof scenario.payload_transactions === 'string'
    ? JSON.parse(scenario.payload_transactions)
    : scenario.payload_transactions;

  let updatedBalance = account.balance;

  transaction(db => {
    const insertTx = db.prepare(
      'INSERT INTO transactions (account_id, user_id, date, category, amount, type, description, icon, period) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    for (const t of txList) {
      const type = t.type || (t.category.includes('Masuk') || t.category.includes('Gaji') || t.category.includes('QRIS') ? 'CR' : 'DB');
      insertTx.run(
        account.id,
        scenario.persona_id,
        t.date,
        t.category,
        t.amount,
        type,
        t.desc || t.description,
        t.icon || 'bi-receipt',
        'current'
      );

      const delta = type === 'CR' ? t.amount : -t.amount;
      updatedBalance += delta;
    }

    db.prepare('UPDATE accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      updatedBalance,
      account.id
    );

    db.prepare(
      'INSERT INTO audit_logs (user_id, engine, message, payload) VALUES (?, ?, ?, ?)'
    ).run(
      scenario.persona_id,
      'SIMULATION',
      `Skenario dijalankan: ${scenario.name}`,
      JSON.stringify({ scenario_id: scenario.id, injected_tx_count: txList.length })
    );
  });

  const payload = {
    scenario_id: scenario.id,
    scenario_name: scenario.name,
    persona_id: scenario.persona_id,
    transactions_injected_count: txList.length,
    updated_balance: updatedBalance,
    expected_event: scenario.expected_event,
    expected_bundle: scenario.expected_bundle
  };

  res.json({
    success: true,
    ...payload,
    data: payload
  });
});

module.exports = router;
