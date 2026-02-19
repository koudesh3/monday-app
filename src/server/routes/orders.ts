import { Hono } from 'hono';

const orders = new Hono();

orders.post('/', (c) => {
  return c.json({ error: 'Not Implemented' }, 501);
});

export default orders;
