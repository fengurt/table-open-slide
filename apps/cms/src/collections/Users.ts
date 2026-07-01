import type { CollectionConfig } from 'payload';
import { readRoleFromUser } from '../access';

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    useAPIKey: true,
    tokenExpiration: 60 * 60 * 24 * 7,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'author',
      options: [
        { label: 'Superadmin', value: 'superadmin' },
        { label: 'Author', value: 'author' },
        { label: 'Editor', value: 'editor' },
        { label: 'Reviewer', value: 'reviewer' },
        { label: 'Translator', value: 'translator' },
        { label: 'Approver', value: 'approver' },
        { label: 'Viewer', value: 'viewer' },
        { label: 'Presenter', value: 'presenter' },
        { label: 'Data owner', value: 'data-owner' },
      ],
      access: {
        update: ({ req }) => readRoleFromUser(req.user) === 'superadmin',
      },
    },
  ],
};
