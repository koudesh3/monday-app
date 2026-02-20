import { Hono } from 'hono';
import { authMiddleware, SessionUser } from '../auth';
import { CreateOrderSchema } from '../schemas';
import { getFragrances } from '../storage';
import { createOrderItem, createBoxSubitem } from '../monday-api';

type Env = { Variables: { user: SessionUser } };

const orders = new Hono<Env>();

orders.use('*', authMiddleware);

orders.post('/', async (c) => {
  const user = c.get('user');
  const accountId = String(user.dat.account_id);
  const body = await c.req.json();
  const result = CreateOrderSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.issues }, 422);
  }

  const boardId = Number(process.env.MONDAY_BOARD_ID);
  if (!boardId) {
    return c.json({ error: 'Server misconfigured: missing board ID' }, 500);
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

  const itemId = await createOrderItem({
    boardId,
    itemName: `${result.data.first_name} ${result.data.last_name}`,
    token: user.dat.shortLivedToken,
  });

  const subitemIds = await Promise.all(
    result.data.boxes.map((box, i) => {
      const fragranceNames = box.fragrance_ids.map((id) => nameById.get(id)!) as [string, string, string];
      return createBoxSubitem({
        parentItemId: itemId,
        boxNumber: i + 1,
        inscription: box.inscription,
        fragranceNames,
        token: user.dat.shortLivedToken,
      });
    })
  );

  return c.json({ itemId, subitemIds }, 201);
});

export default orders;
