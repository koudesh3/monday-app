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

app.get('/health', (c) => {
    return c.json({ ok: true });
});

app.route('/api/fragrances', fragrances);
app.route('/api/orders', orders);

app.use('/assets/*', serveStatic({ root: 'dist/client', rewriteRequestPath: (path) => path.replace(/^\/assets/, '') }));

// note: serveStatic doesn't support SPA fallback on Node.js, so we read index.html once
// at startup and serve it for all unmatched routes to support client-side routing
const indexHtml = readFileSync(join(process.cwd(), 'dist/client/index.html'), 'utf-8');

app.get('*', (c) => {
    return c.html(indexHtml);
});

const port = Number(process.env.PORT ?? 8080);

if (process.env.NODE_ENV !== 'test') {
    serve({ fetch: app.fetch, port }, () => {
        logger.info(`Server running on port ${port}`);
    });
}

export { app };
