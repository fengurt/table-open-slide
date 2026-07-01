import type { Access } from 'payload';

export type UserRole =
  | 'superadmin'
  | 'author'
  | 'editor'
  | 'reviewer'
  | 'translator'
  | 'approver'
  | 'viewer'
  | 'presenter'
  | 'data-owner';

export function readRoleFromUser(user: unknown): UserRole | null {
  if (!user || typeof user !== 'object') return null;
  const role = (user as { role?: UserRole }).role;
  return role ?? null;
}

const isDev = () => process.env.NODE_ENV === 'development';

export const canReadContentBlocks: Access = ({ req }) => {
  if (isDev()) return true;
  const role = readRoleFromUser(req.user);
  return role !== null || process.env.PAYLOAD_PUBLIC_READ === 'true';
};

export const canWriteContentBlocks: Access = ({ req }) => {
  if (isDev()) return true;
  const role = readRoleFromUser(req.user);
  if (role === 'superadmin' || role === 'author' || role === 'editor') return true;
  if (role === 'translator') return true;
  return process.env.PAYLOAD_PUBLIC_WRITE === 'true';
};

export const canReadSlideComments: Access = () => true;

export const canWriteSlideComments: Access = ({ req }) => {
  if (isDev()) return true;
  const role = readRoleFromUser(req.user);
  if (role === 'viewer' || role === 'presenter') return false;
  return role !== null || process.env.PAYLOAD_PUBLIC_COMMENTS === 'true';
};

export const successionRead: Access = ({ req }) => {
  const role = readRoleFromUser(req.user);
  return role === 'superadmin' || role === 'approver';
};
