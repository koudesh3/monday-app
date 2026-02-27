/**
 * Validation schemas
 * Zod schemas for request/response validation and type inference
 */

import { z } from 'zod';

/**
 * JWT session user payload
 */
export const SessionUserSchema = z.object({
    dat: z.object({
        account_id: z.number(),
        user_id: z.number(),
    }),
});

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
    boxes: z.array(BoxSchema).min(1).max(100), // note: This is my "reasonable" maximum on order line count
});

/**
 * Webhook event payload from Monday.com
 * note: This is for "column_change" webhook events
 */
export const WebhookPayloadSchema = z.object({
    challenge: z.string().optional(),
    event: z.object({
        boardId: z.number(),
        pulseId: z.number(),
        columnId: z.string(),
        columnType: z.string(),
        value: z.object({
            label: z.object({
                index: z.number(),
                text: z.string(),
            }),
        }),
        previousValue: z.any().optional(),
        type: z.string(),
        parentItemId: z.string(),
        parentItemBoardId: z.string(),
    }).optional(),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;
export type Fragrance = z.infer<typeof FragranceSchema>;
export type CreateFragrance = z.infer<typeof CreateFragranceSchema>;
export type Box = z.infer<typeof BoxSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;