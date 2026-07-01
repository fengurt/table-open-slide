import { z } from 'zod';

export const brandSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  tagline: z.string().optional(),
});

export type Brand = z.infer<typeof brandSchema>;
