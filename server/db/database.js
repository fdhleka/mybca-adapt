/**
 * Database Connection & Interface Module
 * myBCA ADAPT — SQLite Relational Store via node:sqlite (DatabaseSync)
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let dbInstance = null;

/**
 * Open or retrieve active SQLite database connection
 * Enforces WAL mode and Foreign Keys
 */
function getDb(customPath = null) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const targetPath = customPath || DB_PATH;
  const dbDir = path.dirname(targetPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new DatabaseSync(targetPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  if (!customPath) {
    dbInstance = db;
  }
  return db;
}

/**
 * Execute DDL migration from schema.sql
 */
function migrate(db = null) {
  const conn = db || getDb();
  if (fs.existsSync(SCHEMA_PATH)) {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    conn.exec(schemaSql);
  }
  return conn;
}

/**
 * Execute a query returning all rows
 */
function queryAll(sql, params = [], db = null) {
  const conn = db || getDb();
  const stmt = conn.prepare(sql);
  return stmt.all(...params);
}

/**
 * Execute a query returning a single row
 */
function queryOne(sql, params = [], db = null) {
  const conn = db || getDb();
  const stmt = conn.prepare(sql);
  return stmt.get(...params);
}

/**
 * Execute an INSERT / UPDATE / DELETE statement
 * Returns { changes, lastInsertRowid }
 */
function execute(sql, params = [], db = null) {
  const conn = db || getDb();
  const stmt = conn.prepare(sql);
  return stmt.run(...params);
}

/**
 * Run operations inside an ACID transaction
 */
function transaction(callback, db = null) {
  const conn = db || getDb();
  conn.exec('BEGIN TRANSACTION;');
  try {
    const result = callback(conn);
    conn.exec('COMMIT;');
    return result;
  } catch (err) {
    conn.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Close database connection
 */
function closeDb() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (_) {}
    dbInstance = null;
  }
}

module.exports = {
  DB_PATH,
  SCHEMA_PATH,
  getDb,
  migrate,
  queryAll,
  queryOne,
  execute,
  transaction,
  closeDb
};
