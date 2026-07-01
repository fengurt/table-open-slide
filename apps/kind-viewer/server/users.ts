import { type DbUser, getDb, type UserRole } from './db.js';
import { hashSecret, verifySecret } from './password.js';

export type PublicUser = {
  email: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
};

function rowToUser(row: {
  email: string;
  secret_hash: string;
  role: UserRole;
  created_at: number;
  updated_at: number;
}): DbUser {
  return {
    email: row.email,
    secretHash: row.secret_hash,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublic(user: DbUser): PublicUser {
  return {
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function findUserByEmail(email: string): DbUser | null {
  const normalized = email.trim().toLowerCase();
  const row = getDb()
    .prepare(
      `SELECT email, secret_hash, role, created_at, updated_at
       FROM authorized_users WHERE email = ?`,
    )
    .get(normalized) as
    | {
        email: string;
        secret_hash: string;
        role: UserRole;
        created_at: number;
        updated_at: number;
      }
    | undefined;
  return row ? rowToUser(row) : null;
}

export function listUsers(): PublicUser[] {
  const rows = getDb()
    .prepare(
      `SELECT email, secret_hash, role, created_at, updated_at
       FROM authorized_users ORDER BY role DESC, email ASC`,
    )
    .all() as Array<{
    email: string;
    secret_hash: string;
    role: UserRole;
    created_at: number;
    updated_at: number;
  }>;
  return rows.map((r) => toPublic(rowToUser(r)));
}

export function createUser(email: string, secret: string, role: UserRole = 'viewer'): PublicUser {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error('invalid email');
  if (!secret || secret.length < 4) throw new Error('invalid secret');
  if (findUserByEmail(normalized)) throw new Error('email exists');

  const now = Date.now();
  getDb()
    .prepare(
      `INSERT INTO authorized_users (email, secret_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(normalized, hashSecret(secret), role, now, now);
  const created = findUserByEmail(normalized);
  if (!created) throw new Error('create failed');
  return toPublic(created);
}

export function updateUserSecret(email: string, secret: string): PublicUser {
  const normalized = email.trim().toLowerCase();
  if (!secret || secret.length < 4) throw new Error('invalid secret');
  const user = findUserByEmail(normalized);
  if (!user) throw new Error('not found');
  const now = Date.now();
  getDb()
    .prepare(`UPDATE authorized_users SET secret_hash = ?, updated_at = ? WHERE email = ?`)
    .run(hashSecret(secret), now, normalized);
  const updated = findUserByEmail(normalized);
  if (!updated) throw new Error('not found');
  return toPublic(updated);
}

export function deleteUser(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const result = getDb().prepare('DELETE FROM authorized_users WHERE email = ?').run(normalized);
  return result.changes > 0;
}

export function verifyUserCredentials(
  email: string,
  secret: string,
): { user: DbUser } | { error: 'invalid' } {
  const user = findUserByEmail(email);
  if (!user) return { error: 'invalid' };
  if (!verifySecret(secret, user.secretHash)) return { error: 'invalid' };
  return { user };
}
