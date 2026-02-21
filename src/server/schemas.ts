import { z } from 'zod';

export const FragranceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  image_url: z.string().url(),
  recipe: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateFragranceSchema = FragranceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const BoxSchema = z.object({
  inscription: z.string(),
  fragrance_ids: z
    .array(z.string())
    .length(3)
    .refine((ids) => new Set(ids).size === 3, {
      message: 'All 3 fragrance ids must be unique within the box',
    }),
});

export const CreateOrderSchema = z.object({
  boardId: z.number().int().positive(),
  first_name: z.string(),
  last_name: z.string(),
  boxes: z.array(BoxSchema).min(1),
});

export type Fragrance = z.infer<typeof FragranceSchema>;
export type CreateFragrance = z.infer<typeof CreateFragranceSchema>;
export type Box = z.infer<typeof BoxSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
