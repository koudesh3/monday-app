/**
 * Main server application
 * Configures routes, serves client, and starts HTTP server
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Logger } from '@mondaycom/apps-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { port } from './config';
import { Env } from './types';
import fragrances from './routes/fragrances';
import orders from './routes/orders';
import webhook from './routes/webhook';

const logger = new Logger('candle-app');

const app = new Hono<Env>();

/**
 * Health check endpoint
 */
app.get('/health', (c) => {
    return c.json({ ok: true });
});

/**
 * API routes
 */
app.route('/api/fragrances', fragrances);
app.route('/api/orders', orders);
app.route('/webhook', webhook);

/**
 * Serve static assets
 */
app.use('/assets/*', serveStatic({ root: 'dist/client' }));

/**
 * SPA fallback for client-side routing
 * note: serveStatic doesn't support a SPA fallback on Node.js, so cache index.html in memory at startup.
 */
const indexHtml = readFileSync(join(process.cwd(), 'dist/client/index.html'), 'utf-8');
app.get('*', (c) => {
    return c.html(indexHtml);
});

/**
 * Start HTTP server (skipped in test environment)
 */
if (process.env.NODE_ENV !== 'test') {
    serve({ fetch: app.fetch, port }, () => {
        logger.info(`Server running on port ${port}`);
    });
}

export { app };
