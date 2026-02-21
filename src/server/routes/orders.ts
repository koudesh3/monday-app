import retry from 'async-retry';
import { Hono } from 'hono';
import { authMiddleware } from '../auth';
import { CreateOrderSchema } from '../schemas';
import { getFragrances } from '../storage';
import { createItem, createSubitem } from '../monday-api';
import { Env } from '../types';

const orders = new Hono<Env>();

orders.use('*', authMiddleware);

orders.use('*', async (c, next) => {
    const user = c.get('user');
    c.set('accountId', String(user.dat.account_id));
    await next();
});

orders.post('/', async (c) => {
    const user = c.get('user');
    const accountId = c.get('accountId');
    const body = await c.req.json();
    const result = CreateOrderSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error.issues }, 422);
    }

    const fragrances = await getFragrances(accountId);
    const nameById = new Map(fragrances.map((f) => [f.id, f.name]));

    for (const box of result.data.boxes) {
        for (const fid of box.fragrance_ids) {
            if (!nameById.has(fid)) {
                return c.json({ error: `Unknown fragrance id: ${fid}` }, 422);
            }
        }
    }

    // note: boardId comes from monday.get('context') on the client.
    // The shortLivedToken is scoped to the user's existing permissions, so even a tampered boardId can't escalate access beyond what the user already has.
    let itemId: string;
    try {
        itemId = await retry(
            async () =>
                createItem({
                    boardId: result.data.boardId,
                    itemName: `${result.data.first_name} ${result.data.last_name}`,
                    token: user.dat.shortLivedToken,
                }),
            { retries: 3 }
        );
    } catch (err) {
        console.error('[orders] item creation failed after retries', { accountId, err });
        return c.json({ error: 'Failed to create order item after retries' }, 500);
    }

    // note: Each subitem creation is retried independently.
    // 1. If a request times out after committing, a retry may create a duplicate subitem.
    // 2. If all retries fail, the order item will exist without its line items.
    // 3. Both cases are logged for observability and can be corrected manually on the board.
    try {
        const subitemIds = await Promise.all(
            result.data.boxes.map((box, i) =>
                retry(
                    async () =>
                        createSubitem({
                            parentItemId: itemId,
                            boxNumber: i + 1,
                            inscription: box.inscription,
                            fragranceNames: box.fragrance_ids.map((id) => nameById.get(id)!), // validated above
                            token: user.dat.shortLivedToken,
                        }),
                    { retries: 3 }
                )
            )
        );
        return c.json({ itemId, subitemIds }, 201);
    } catch (err) {
        console.error('[orders] subitem creation failed after retries', { itemId, accountId, err });
        return c.json(
            { error: 'Failed to create subitems after retries', itemId },
            500
        );
    }
});

export default orders;
