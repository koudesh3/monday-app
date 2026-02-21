import { Hono } from 'hono';
import retry from 'async-retry';
import { authMiddleware, SessionUser } from '../auth';
import { CreateOrderSchema } from '../schemas';
import { getFragrances } from '../storage';
import { createItem, createSubitem } from '../monday-api';

type Env = { Variables: { user: SessionUser } };

const orders = new Hono<Env>();

orders.use('*', authMiddleware);

orders.post('/', async (c) => {
    const boardId = Number(process.env.MONDAY_BOARD_ID);
    if (!boardId || isNaN(boardId)) {
        return c.json({ error: 'Server misconfigured: missing or invalid board ID' }, 500);
    }

    const user = c.get('user');
    const accountId = String(user.dat.account_id);
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

    const itemId = await createItem({
        boardId,
        itemName: `${result.data.first_name} ${result.data.last_name}`,
        token: user.dat.shortLivedToken,
    });

    // Retry each subitem creation independently.
    // note: If a request times out post commits, a retry may create a duplicate subitem.
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
});

export default orders;
