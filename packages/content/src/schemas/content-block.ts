import { z } from 'zod';

export const contentBlockBodySchema = z.object({
  en: z.string(),
  'zh-CN': z.string(),
  'zh-TW': z.string(),
  ja: z.string(),
});

export const contentBlockSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1),
  body: contentBlockBodySchema,
});

export type ContentBlock = z.infer<typeof contentBlockSchema>;
