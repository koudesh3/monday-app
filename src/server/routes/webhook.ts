import { Hono } from 'hono';
import { getSubitemsWithStatus, updateItemStatus } from '../mondayClient';

const webhook = new Hono();

const SUBITEM_STATUS_COLUMN_ID = 'color_mm0qcgc2';
const PARENT_STATUS_COLUMN_ID = 'status';

type WebhookPayload = {
    challenge?: string;
    event?: {
        boardId: number;
        pulseId: number;
        columnId: string;
        columnType: string;
        value: {
            label: {
                index: number;
                text: string;
            };
        };
        previousValue?: any;
        type: string;
        parentItemId: string;
        parentItemBoardId: string;
    };
};

function computeRolledUpStatus(subitemStatuses: Array<string | null>): string {
    // Priority: "Not Started" > "Backordered" > "In Progress" > "Shipped"
    const hasNotStarted = subitemStatuses.some((status) => status === 'Not Started');
    if (hasNotStarted) {
        return 'Not Started';
    }

    const hasBackordered = subitemStatuses.some((status) => status === 'Backordered');
    if (hasBackordered) {
        return 'Backordered';
    }

    const hasInProgress = subitemStatuses.some((status) => status === 'In Progress');
    if (hasInProgress) {
        return 'In Progress';
    }

    // All subitems are "Shipped"
    return 'Shipped';
}

webhook.post('/', async (c) => {
    const body = (await c.req.json()) as WebhookPayload;

    // Handle challenge handshake
    if (body.challenge) {
        return c.json({ challenge: body.challenge });
    }

    const event = body.event;
    if (!event) {
        return c.json({ ok: true });
    }

    // Only process status column changes
    if (event.columnId !== SUBITEM_STATUS_COLUMN_ID) {
        return c.json({ ok: true });
    }

    try {
        // Get all subitems with their statuses
        const subitems = await getSubitemsWithStatus({
            parentItemId: event.parentItemId,
            statusColumnId: SUBITEM_STATUS_COLUMN_ID,
        });

        // Compute rolled-up status
        const statuses = subitems.map((s) => s.statusLabel);
        const rolledUpStatus = computeRolledUpStatus(statuses);

        // Update parent item status
        await updateItemStatus({
            boardId: String(event.parentItemBoardId),
            itemId: event.parentItemId,
            statusColumnId: PARENT_STATUS_COLUMN_ID,
            statusLabel: rolledUpStatus,
        });

        return c.json({ ok: true });
    } catch (err) {
        console.error('[webhook] Failed to process status rollup', { event, err });
        return c.json({ error: 'Failed to process webhook' }, 500);
    }
});

export default webhook;
