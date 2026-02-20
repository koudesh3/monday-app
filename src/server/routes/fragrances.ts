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
  const accountId = String(user.dat.account_id);
  const items = await getFragrances(accountId);
  return c.json(items);
});

fragrances.post('/', async (c) => {
  const user = c.get('user');
  const accountId = String(user.dat.account_id);
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

  const items = await getFragrances(accountId);
  items.push(newFragrance);
  await saveFragrances(items, accountId);

  return c.json(newFragrance, 201);
});

fragrances.put('/:id', async (c) => {
  const user = c.get('user');
  const accountId = String(user.dat.account_id);
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = CreateFragranceSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.issues }, 422);
  }

  const items = await getFragrances(accountId);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return c.json({ error: 'Not found' }, 404);
  }

  items[index] = {
    ...items[index],
    ...result.data,
    updated_at: new Date().toISOString(),
  };
  await saveFragrances(items, accountId);

  return c.json(items[index]);
});

fragrances.delete('/:id', async (c) => {
  const user = c.get('user');
  const accountId = String(user.dat.account_id);
  const id = c.req.param('id');

  const items = await getFragrances(accountId);
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) {
    return c.json({ error: 'Not found' }, 404);
  }

  await saveFragrances(filtered, accountId);

  return c.body(null, 204);
});

export default fragrances;
