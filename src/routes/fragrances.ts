import { Hono } from 'hono';

const fragrances = new Hono();

fragrances.get('/', (c) => {
  return c.json({ error: 'Not Implemented' }, 501);
});

fragrances.post('/', (c) => {
  return c.json({ error: 'Not Implemented' }, 501);
});

fragrances.put('/:id', (c) => {
  return c.json({ error: 'Not Implemented' }, 501);
});

fragrances.delete('/:id', (c) => {
  return c.json({ error: 'Not Implemented' }, 501);
});

export default fragrances;
