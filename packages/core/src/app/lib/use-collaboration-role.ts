import config from 'virtual:open-slide/config';
import type { CollaborationRole } from '../../config.ts';

export function useCollaborationRole(): CollaborationRole {
  const fromConfig = config.collaborationRole;
  if (fromConfig) return fromConfig;
  const fromEnv = import.meta.env.VITE_OPENSLIDE_ROLE as CollaborationRole | undefined;
  if (fromEnv) return fromEnv;
  return 'author';
}

export function canUseInspectorComments(role: CollaborationRole): boolean {
  return role !== 'viewer' && role !== 'presenter';
}

export function canApplyComments(role: CollaborationRole): boolean {
  return role === 'superadmin' || role === 'author' || role === 'editor' || role === 'reviewer';
}
