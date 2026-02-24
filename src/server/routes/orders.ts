import retry from 'async-retry';
import { Hono } from 'hono';
import { Logger } from '@mondaycom/apps-sdk';
import { customAlphabet } from 'nanoid';
import { authMiddleware } from '../auth';
import { CreateOrderSchema } from '../schemas';
import { getFragrances } from '../storage';
import { createItem, createSubitem } from '../mondayClient';
import { Env } from '../types';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);
const logger = new Logger('orders');

const orders = new Hono<Env>();

orders.use('*', authMiddleware);

orders.use('*', async (c, next) => {
    const user = c.get('user');
    c.set('accountId', String(user.dat.account_id));
    await next();
});

orders.post('/', async (c) => {
    const accountId = c.get('accountId');
    const body = await c.req.json();
    const result = CreateOrderSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error.issues }, 422);
    }

    const fragrances = await getFragrances(accountId);
    const nameById = new Map(fragrances.map((f) => [f.id, f.name]));

    for (const orderLine of result.data.boxes) {
        for (const fid of orderLine.fragrance_ids) {
            if (!nameById.has(fid)) {
                return c.json({ error: `Unknown fragrance id: ${fid}` }, 422);
            }
        }
    }

    let itemId: string;
    const orderNumber = `ORD-${nanoid()}`;
    const createItemParams = {
        boardId: result.data.boardId,
        itemName: orderNumber,
        email: result.data.email,
        phone: result.data.phone,
        firstName: result.data.first_name,
        lastName: result.data.last_name,
        shippingAddress: result.data.shipping_address,
        orderReceivedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    };

    try {
        itemId = await retry(
            async (bail, attemptNumber) => {
                try {
                    const id = await createItem(createItemParams);
                    return id;
                } catch (err: any) {
                    const status = err.response?.status;
                    // Bail on client errors that won't fix themselves (400, 401, 403, 404, etc.)
                    // Retry on rate limits (429), timeouts (408), and server errors (5xx)
                    if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
                        logger.error(`[orders] createItem non-retryable error: ${JSON.stringify({
                            attemptNumber,
                            accountId,
                            orderNumber,
                            status,
                            error: err.message,
                            response: err.response,
                        })}`);
                        bail(err);
                        return ''; // unreachable, satisfies TS
                    }
                    throw err;
                }
            },
            { retries: 3 }
        );
    } catch (err: any) {
        logger.error(`[orders] item creation failed after retries: ${JSON.stringify({
            accountId,
            orderNumber,
            boardId: result.data.boardId,
            error: err.message,
            response: err.response,
            stack: err.stack,
        })}`);
        return c.json({ error: 'Failed to create order item after retries' }, 500);
    }

    // note: Each subitem creation is retried independently.
    // 1. If a request times out after committing, a retry may create a duplicate subitem.
    // 2. If all retries fail, the order item will exist without its line items.
    // 3. Both cases are logged for observability and can be corrected manually on the board.
    try {
        const subitemIds = await Promise.all(
            result.data.boxes.map((orderLine, i) =>
                retry(
                    async (bail, attemptNumber) => {
                        const orderLineNumber = i + 1;
                        try {
                            const id = await createSubitem({
                                parentItemId: itemId,
                                orderLineNumber,
                                inscription: orderLine.inscription,
                                fragranceNames: orderLine.fragrance_ids.map((id) => nameById.get(id)!), // validated above
                            });
                            return id;
                        } catch (err: any) {
                            const status = err.response?.status;
                            // Bail on client errors that won't fix themselves (400, 401, 403, 404, etc.)
                            // Retry on rate limits (429), timeouts (408), and server errors (5xx)
                            if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
                                logger.error(`[orders] createSubitem non-retryable error: ${JSON.stringify({
                                    attemptNumber,
                                    accountId,
                                    itemId,
                                    orderLineNumber,
                                    status,
                                    error: err.message,
                                    response: err.response,
                                })}`);
                                bail(err);
                                return ''; // unreachable, satisfies TS
                            }
                            throw err;
                        }
                    },
                    { retries: 3 }
                )
            )
        );
        return c.json({ itemId, subitemIds }, 201);
    } catch (err: any) {
        logger.error(`[orders] subitem creation failed after retries: ${JSON.stringify({
            itemId,
            accountId,
            error: err.message,
            response: err.response,
            stack: err.stack,
        })}`);
        return c.json(
            { error: 'Failed to create subitems after retries', itemId },
            500
        );
    }
});

export default orders;
