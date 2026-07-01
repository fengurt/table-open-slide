import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { hashSecret } from './password.js';
export const DEFAULT_ADMIN_EMAIL = 'hi@kind4all.ai';
let db = null;
export function getDbPath() {
    return (process.env.KIND_DB_PATH?.trim() || path.resolve(process.cwd(), 'data', 'kind-viewer.sqlite'));
}
export function getDb() {
    if (db)
        return db;
    const filePath = getDbPath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const instance = new DatabaseSync(filePath);
    instance.exec('PRAGMA journal_mode = WAL;');
    initSchema(instance);
    seedDefaultAdmin(instance);
    db = instance;
    return instance;
}
function initSchema(database) {
    database.exec(`
    CREATE TABLE IF NOT EXISTS authorized_users (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      secret_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_authorized_users_role ON authorized_users(role);
  `);
}
function seedDefaultAdmin(database) {
    const email = DEFAULT_ADMIN_EMAIL.toLowerCase();
    const row = database.prepare('SELECT email FROM authorized_users WHERE email = ?').get(email);
    if (row)
        return;
    const bootstrapSecret = process.env.KIND_ADMIN_SECRET?.trim() || process.env.KIND_ACCESS_SECRET?.trim() || 'kindguy';
    const now = Date.now();
    database
        .prepare(`INSERT INTO authorized_users (email, secret_hash, role, created_at, updated_at)
       VALUES (?, ?, 'admin', ?, ?)`)
        .run(email, hashSecret(bootstrapSecret), now, now);
}
export function closeDb() {
    if (db) {
        db.close();
        db = null;
    }
}
