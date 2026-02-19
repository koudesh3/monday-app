import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Logger } from '@mondaycom/apps-sdk';
import fragrances from './routes/fragrances';
import orders from './routes/orders';

const logger = new Logger('candle-app');

const app = new Hono();

app.get('/health', (c) => {
  return c.json({ ok: true });
});

app.route('/api/fragrances', fragrances);
app.route('/api/orders', orders);

app.use('/assets/*', serveStatic({ root: 'dist/client', rewriteRequestPath: (path) => path.replace(/^\/assets/, '') }));

app.get('*', (c) => {
  return c.html(
    `<!DOCTYPE html><html><head><title>Candle Gift Box</title></head><body><div id="root"></div><script src="/assets/bundle.js"></script></body></html>`
  );
});

const port = Number(process.env.PORT ?? 8080);

if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port }, () => {
    logger.info(`Server running on port ${port}`);
  });
}

export { app };
