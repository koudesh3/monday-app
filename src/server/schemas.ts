import { z } from 'zod';

export const SessionUserSchema = z.object({
    dat: z.object({
        account_id: z.number(),
        user_id: z.number(),
    }),
});

export const FragranceSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.string(),
    image_url: z.string().url(),
    recipe: z.string(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
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
    email: z.string().email(),
    phone: z.string(),
    shipping_address: z.string(),
    boxes: z.array(BoxSchema).min(1).max(100), // note: This is a "reasonable" maximum on order line count
});

export type SessionUser = z.infer<typeof SessionUserSchema>;
export type Fragrance = z.infer<typeof FragranceSchema>;
export type CreateFragrance = z.infer<typeof CreateFragranceSchema>;
export type Box = z.infer<typeof BoxSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
