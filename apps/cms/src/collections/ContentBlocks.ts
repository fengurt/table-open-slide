import type { CollectionConfig } from 'payload';
import { canReadContentBlocks, canWriteContentBlocks } from '../access';

export const ContentBlocks: CollectionConfig = {
  slug: 'content-blocks',
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['key', 'updatedAt'],
  },
  access: {
    read: canReadContentBlocks,
    create: canWriteContentBlocks,
    update: canWriteContentBlocks,
    delete: canWriteContentBlocks,
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'body',
      type: 'text',
      required: true,
      localized: true,
    },
  ],
};
