/**
 * Shared domain schemas and types
 * Single source of truth for types used across client and server
 */

import { z } from 'zod';

/**
 * Fragrance data structure
 */
export const FragranceSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.string(),
    image_url: z.string().url().optional(),
    recipe: z.string().optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

/**
 * Fragrance creation payload (omits id and timestamps)
 */
export const CreateFragranceSchema = FragranceSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});

/**
 * Box data in order (inscription + 3 unique fragrances)
 */
export const BoxSchema = z.object({
    inscription: z.string(),
    fragrance_ids: z
        .array(z.string())
        .length(3)
        .refine((ids) => new Set(ids).size === 3, {
            message: 'All 3 fragrance ids must be unique within the box',
        }),
});

/**
 * Order creation payload
 */
export const CreateOrderSchema = z.object({
    boardId: z.number().int().positive(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    shipping_address: z.string(),
    boxes: z.array(BoxSchema).min(1).max(100),
});

// Inferred types
export type Fragrance = z.infer<typeof FragranceSchema>;
export type CreateFragrance = z.infer<typeof CreateFragranceSchema>;
export type Box = z.infer<typeof BoxSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
