import type { CollectionConfig } from 'payload';
import { canReadContentBlocks, canWriteContentBlocks } from '../access';

export const SlideBindings: CollectionConfig = {
  slug: 'slide-bindings',
  admin: {
    useAsTitle: 'contentKey',
  },
  access: {
    read: canReadContentBlocks,
    create: canWriteContentBlocks,
    update: canWriteContentBlocks,
    delete: canWriteContentBlocks,
  },
  fields: [
    { name: 'slideId', type: 'text', required: true, index: true },
    { name: 'contentKey', type: 'text', required: true },
    { name: 'nodeId', type: 'text' },
  ],
};
