import { Hono } from 'hono';
import crypto from 'crypto';
import { authMiddleware, SessionUser } from '../auth';
import { CreateFragranceSchema, Fragrance } from '../schemas';
import { getFragrances, saveFragrances } from '../storage';

type Env = { Variables: { user: SessionUser } };

const fragrances = new Hono<Env>();

fragrances.use('*', authMiddleware);

fragrances.get('/', async (c) => {
  const user = c.get('user');
  const items = await getFragrances(String(user.dat.account_id));
  return c.json(items);
});

fragrances.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const result = CreateFragranceSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.issues }, 422);
  }

  const now = new Date().toISOString();
  const newFragrance: Fragrance = {
    id: crypto.randomUUID(),
    ...result.data,
    created_at: now,
    updated_at: now,
  };

  const items = await getFragrances(String(user.dat.account_id));
  items.push(newFragrance);
  await saveFragrances(items, String(user.dat.account_id));

  return c.json(newFragrance, 201);
});

fragrances.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = CreateFragranceSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.issues }, 422);
  }

  const items = await getFragrances(String(user.dat.account_id));
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return c.json({ error: 'Not found' }, 404);
  }

  items[index] = {
    ...items[index],
    ...result.data,
    updated_at: new Date().toISOString(),
  };
  await saveFragrances(items, String(user.dat.account_id));

  return c.json(items[index]);
});

fragrances.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const items = await getFragrances(String(user.dat.account_id));
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return c.json({ error: 'Not found' }, 404);
  }

  items.splice(index, 1);
  await saveFragrances(items, String(user.dat.account_id));

  return c.body(null, 204);
});

export default fragrances;
