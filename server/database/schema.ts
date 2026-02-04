import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { databaseConfig } from '~/server/config/database'

export function createDatabase(): Database.Database {
  // Use absolute path if provided, otherwise resolve relative to cwd
  const dbPath = databaseConfig.databasePath.startsWith('/')
    ? databaseConfig.databasePath
    : resolve(process.cwd(), databaseConfig.databasePath)

  // Ensure the directory exists before creating the database
  const dbDir = dirname(dbPath)
  mkdirSync(dbDir, { recursive: true })

  const db = new Database(dbPath)

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Create subscriptions table (for push notifications)
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT UNIQUE NOT NULL,
      keys TEXT NOT NULL,
      device_id TEXT NOT NULL,
      expiration_time TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_device_id ON subscriptions(device_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_endpoint ON subscriptions(endpoint);
  `)

  // Create logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      source TEXT NOT NULL,
      client_id TEXT,
      user_agent TEXT,
      ip_address TEXT,
      metadata TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
    CREATE INDEX IF NOT EXISTS idx_logs_source ON logs(source);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_logs_client_id ON logs(client_id);
  `)

  // Create example_items table (for example CRUD service)
  db.exec(`
    CREATE TABLE IF NOT EXISTS example_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)

  return db
}
