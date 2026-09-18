// Set up DB path for Vercel's read-only filesystem
if (process.env.VERCEL) {
  process.env.DB_PATH = '/tmp/database.sqlite';
}

const { app, ensureDatabaseReady } = require('../server/server.js');

// Ensure DB is seeded on cold start
try {
  ensureDatabaseReady();
} catch (error) {
  console.error("Failed to ensure DB ready:", error);
}

// Export the express app for Vercel Serverless Functions
module.exports = app;
