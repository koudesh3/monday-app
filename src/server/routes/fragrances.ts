import { Hono } from 'hono';
import crypto from 'crypto';
import { authMiddleware } from '../auth';
import { CreateProductSchema, Product } from '../schemas';
import { getFragrances, saveFragrances } from '../storage';

type Env = { Variables: { user: { shortLivedToken: string } } };

const fragrances = new Hono<Env>();

fragrances.use('*', authMiddleware);

fragrances.get('/', async (c) => {
  const user = c.get('user');
  const items = await getFragrances(user.shortLivedToken);
  return c.json(items);
});

fragrances.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const result = CreateProductSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.issues }, 422);
  }

  const now = new Date().toISOString();
  const newProduct: Product = {
    id: crypto.randomUUID(),
    ...result.data,
    created_at: now,
    updated_at: now,
  };

  const items = await getFragrances(user.shortLivedToken);
  items.push(newProduct);
  await saveFragrances(items, user.shortLivedToken);

  return c.json(newProduct, 201);
});

fragrances.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = CreateProductSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.issues }, 422);
  }

  const items = await getFragrances(user.shortLivedToken);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return c.json({ error: 'Not found' }, 404);
  }

  items[index] = {
    ...items[index],
    ...result.data,
    updated_at: new Date().toISOString(),
  };
  await saveFragrances(items, user.shortLivedToken);

  return c.json(items[index]);
});

fragrances.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const items = await getFragrances(user.shortLivedToken);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return c.json({ error: 'Not found' }, 404);
  }

  items.splice(index, 1);
  await saveFragrances(items, user.shortLivedToken);

  return c.body(null, 204);
});

export default fragrances;
