import { z } from 'zod';

export const metricLabelSchema = z.object({
  en: z.string().optional(),
  'zh-CN': z.string().optional(),
  'zh-TW': z.string().optional(),
  ja: z.string().optional(),
});

export const metricSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  value: z.number(),
  currency: z.string().default('USD'),
  label: metricLabelSchema.optional(),
});

export type Metric = z.infer<typeof metricSchema>;
