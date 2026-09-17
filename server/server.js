/**
 * Server Entry Point
 * myBCA ADAPT — Express Backend Server
 */

const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { getDb, migrate, queryAll, queryOne } = require('./db/database');
const { seedDatabase } = require('./db/seed');

// Import Route Modules
const authRoutes = require('./routes/auth');
const accountsRoutes = require('./routes/accounts');
const transactionsRoutes = require('./routes/transactions');
const featuresRoutes = require('./routes/features');
const bundlesRoutes = require('./routes/bundles');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const simulationRoutes = require('./routes/simulation');
const vouchersRoutes = require('./routes/vouchers');

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-persona-id']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public/ directory and root for existing assets
const publicPath = path.join(__dirname, '..', 'public');
const rootPath = path.join(__dirname, '..');

app.use(express.static(publicPath));
app.use('/assets', express.static(rootPath));
app.use('/prototype', express.static(path.join(rootPath, 'prototype')));

// Direct static routes for authentic BCA styles and assets
app.get('/combined-styles-komplit.css', (req, res) => {
  res.sendFile(path.join(rootPath, 'combined-styles-komplit.css'));
});

// REST API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/bundles', bundlesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/vouchers', vouchersRoutes);

/**
 * GET /api/personas
 * Public endpoint to populate Judge Quick Switcher helper dropdown
 */
app.get('/api/personas', (req, res) => {
  try {
    const users = queryAll('SELECT id, bca_id, name, email, age, title, occupation, avatar_url, timeliness_rate, savings_consistency FROM users ORDER BY id ASC');
    const accounts = queryAll('SELECT * FROM accounts');
    const userFeatures = queryAll("SELECT user_id, feature_id FROM user_features WHERE status = 'ACTIVE'");

    const personas = users.map(u => {
      const acc = accounts.find(a => a.user_id === u.id);
      const activeFeats = userFeatures.filter(f => f.user_id === u.id).map(f => f.feature_id);
      return {
        ...u,
        account: acc || null,
        active_features: activeFeats
      };
    });

    res.json({
      success: true,
      data: personas
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Root API Health Check
app.get('/api', (req, res) => {
  res.json({
    name: 'myBCA ADAPT API',
    version: '1.0.0',
    status: 'ONLINE',
    timestamp: new Date().toISOString()
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Terjadi kesalahan pada server.'
    }
  });
});

// Auto-seed if database is empty on server boot
function ensureDatabaseReady() {
  try {
    const db = getDb();
    migrate(db);
    const userCount = queryOne('SELECT COUNT(*) as count FROM users', [], db)?.count || 0;
    if (userCount === 0) {
      console.log('Database empty. Running initial pristine seed...');
      seedDatabase(db);
      console.log('Initial seed complete.');
    }
  } catch (err) {
    console.error('Failed to initialize database on startup:', err);
  }
}

// Start Server
if (require.main === module) {
  ensureDatabaseReady();
  app.listen(PORT, () => {
    console.log(`myBCA ADAPT Backend Server running on http://localhost:${PORT}`);
    console.log(`Database connected: SQLite (${getDb().name || 'server/db/database.sqlite'})`);
  });
}

module.exports = {
  app,
  ensureDatabaseReady
};
