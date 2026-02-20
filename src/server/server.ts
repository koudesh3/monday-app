import dotenv from 'dotenv';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Logger } from '@mondaycom/apps-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import fragrances from './routes/fragrances';
import orders from './routes/orders';

dotenv.config();

const logger = new Logger('candle-app');

const app = new Hono();

// routes
app.get('/health', (c) => {
    return c.json({ ok: true });
});
app.route('/api/fragrances', fragrances);
app.route('/api/orders', orders);

// static assets
app.use('/assets/*', serveStatic({ root: 'dist/client' }));

// note: Cache index.html in memory at startup, since serveStatic doesn't support a SPA fallback on Node.js
const indexHtml = readFileSync(join(process.cwd(), 'dist/client/index.html'), 'utf-8');
app.get('*', (c) => {
    return c.html(indexHtml);
});

// start server
const port = Number(process.env.PORT ?? 8080);
if (process.env.NODE_ENV !== 'test') {
    serve({ fetch: app.fetch, port }, () => {
        logger.info(`Server running on port ${port}`);
    });
}

export { app };
