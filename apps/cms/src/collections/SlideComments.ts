import type { CollectionConfig } from 'payload';
import { canReadSlideComments, canWriteSlideComments } from '../access';

export const SlideComments: CollectionConfig = {
  slug: 'slide-comments',
  admin: {
    useAsTitle: 'note',
    defaultColumns: ['slideId', 'line', 'status', 'updatedAt'],
  },
  access: {
    read: canReadSlideComments,
    create: canWriteSlideComments,
    update: canWriteSlideComments,
    delete: canWriteSlideComments,
  },
  fields: [
    { name: 'slideId', type: 'text', required: true, index: true },
    { name: 'line', type: 'number', required: true },
    { name: 'column', type: 'number', required: true },
    { name: 'nodeId', type: 'text' },
    { name: 'note', type: 'textarea', required: true },
    { name: 'hint', type: 'text' },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'inspector',
      options: [
        { label: 'Inspector', value: 'inspector' },
        { label: 'MCP', value: 'mcp' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Applied', value: 'applied' },
      ],
    },
  ],
};
