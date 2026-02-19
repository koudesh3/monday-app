import { Hono } from 'hono';
import { EnvironmentVariablesManager } from '@mondaycom/apps-sdk';
import { authMiddleware } from '../auth';
import { CreateOrderSchema } from '../schemas';
import { getFragrances } from '../storage';
import { createOrderItem, createBoxSubitem } from '../monday-api';

type Env = { Variables: { user: { shortLivedToken: string } } };

const orders = new Hono<Env>();

orders.use('*', authMiddleware);

const envManager = new EnvironmentVariablesManager();

orders.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const result = CreateOrderSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.issues }, 422);
  }

  const boardId = Number(envManager.get('MONDAY_BOARD_ID'));

  const fragrances = await getFragrances(user.shortLivedToken);
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
    token: user.shortLivedToken,
  });

  const subitemIds: string[] = [];
  for (let i = 0; i < result.data.boxes.length; i++) {
    const box = result.data.boxes[i];
    const fragranceNames = box.fragrance_ids.map((id) => nameById.get(id)!) as [string, string, string];
    const subitemId = await createBoxSubitem({
      parentItemId: itemId,
      boxNumber: i + 1,
      inscription: box.inscription,
      fragranceNames,
      token: user.shortLivedToken,
    });
    subitemIds.push(subitemId);
  }

  return c.json({ itemId, subitemIds }, 201);
});

export default orders;
