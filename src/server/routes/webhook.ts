/**
 * Webhook routes
 * Handles Monday.com column_change events for status rollup
 */

import { Hono } from 'hono';
import { Logger } from '@mondaycom/apps-sdk';
import { getSubitemsWithStatus, updateItemStatus, updateItemDate, getItemStatus, COLUMN_IDS } from '../mondayClient.js';
import { WebhookPayloadSchema } from '../schemas.js';
import { getErrorInfo } from '../utils/errors.js';

const webhook = new Hono();
const logger = new Logger('webhook');

/**
 * Status priority for rollup logic (lower index = higher priority)
 */
const STATUS_PRIORITY: Array<string | null> = [
    null,           // "unset" status
    'Not Started',
    'Backordered',
    'In Progress',
];

/**
 * Computes parent item status based on subitem statuses
 * Returns the highest priority status, or "Shipped" if all are shipped
 */
function computeRolledUpStatus(subitemStatuses: Array<string | null>): string {
    for (const status of STATUS_PRIORITY) {
        if (subitemStatuses.includes(status)) {
            return status === null ? 'Not Started' : status;
        }
    }

    if (subitemStatuses.every((s) => s === 'Shipped')) {
        return 'Shipped';
    }

    logger.warn(`[webhook] Unknown status encountered: ${JSON.stringify(subitemStatuses)}`);
    return 'In Progress';
}

/**
 * POST /webhook - Processes column_change events from Monday.com
 * Rolls up subitem statuses to parent item status
 */
webhook.post('/', async (c) => {
    const body = await c.req.json();
    const result = WebhookPayloadSchema.safeParse(body);
    if (!result.success) {
        logger.error(`[webhook] Invalid payload: ${JSON.stringify({ error: result.error.issues, body })}`);
        return c.json({ error: result.error.issues }, 422);
    }

    // Handle challenge handshake
    if (result.data.challenge) {
        return c.json({ challenge: result.data.challenge });
    }

    const event = result.data.event;
    if (!event) {
        return c.json({ ok: true });
    }

    // Only process status column changes
    if (event.columnId !== COLUMN_IDS.SUBITEM_STATUS) {
        return c.json({ ok: true });
    }

    try {
        // Get current parent item status
        const currentStatus = await getItemStatus({
            itemId: event.parentItemId,
            statusColumnId: COLUMN_IDS.PARENT_STATUS,
        });

        // Get all subitems with their statuses
        const subitems = await getSubitemsWithStatus({
            parentItemId: event.parentItemId,
            statusColumnId: COLUMN_IDS.SUBITEM_STATUS,
        });

        // Compute rolled-up status
        const statuses = subitems.map((s) => s.statusLabel);
        const rolledUpStatus = computeRolledUpStatus(statuses);

        // Update parent item status
        await updateItemStatus({
            boardId: event.parentItemBoardId.toString(),
            itemId: event.parentItemId,
            statusColumnId: COLUMN_IDS.PARENT_STATUS,
            statusLabel: rolledUpStatus,
        });

        // If transitioning to "Shipped", set the Order Complete Date
        if (rolledUpStatus === 'Shipped' && currentStatus !== 'Shipped') {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            try {
                await updateItemDate({
                    boardId: event.parentItemBoardId.toString(),
                    itemId: event.parentItemId,
                    dateColumnId: COLUMN_IDS.ORDER_COMPLETE_DATE,
                    date: today,
                });
            } catch (dateErr: unknown) {
                const errorInfo = getErrorInfo(dateErr);
                logger.error(`[webhook] failed to set order complete date: ${JSON.stringify({
                    parentItemId: event.parentItemId,
                    date: today,
                    error: errorInfo.message,
                    response: errorInfo.response,
                    stack: errorInfo.stack,
                })}`);
                // Don't throw - we still want to return success for the status update
            }
        }

        return c.json({ ok: true });
    } catch (err: unknown) {
        const errorInfo = getErrorInfo(err);
        logger.error(`[webhook] Failed to process status rollup: ${JSON.stringify({
            event,
            error: errorInfo.message,
            response: errorInfo.response,
            stack: errorInfo.stack,
        })}`);
        return c.json({ error: 'Failed to process webhook' }, 500);
    }
});

export default webhook;
