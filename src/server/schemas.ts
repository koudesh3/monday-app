/**
 * Server-specific validation schemas
 * Domain schemas are in /src/shared/schemas.ts
 */

import { z } from 'zod';

// Re-export shared domain schemas for convenience
export {
    FragranceSchema,
    CreateFragranceSchema,
    BoxSchema,
    CreateOrderSchema,
    type Fragrance,
    type CreateFragrance,
    type Box,
    type CreateOrder,
} from '../shared/schemas.js';

/**
 * JWT session user payload (server-specific)
 */
export const SessionUserSchema = z.object({
    dat: z.object({
        account_id: z.number(),
        user_id: z.number(),
    }),
});

/**
 * Webhook event payload from Monday.com (server-specific)
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
        previousValue: z.unknown().optional(),
        type: z.string(),
        parentItemId: z.string(),
        parentItemBoardId: z.string(),
    }).optional(),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;