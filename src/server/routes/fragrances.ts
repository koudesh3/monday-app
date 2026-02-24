/**
 * Fragrances API routes
 * CRUD operations for managing fragrance catalog
 */

import crypto from 'crypto';
import { Hono } from 'hono';
import { Mutex } from 'async-mutex';
import { authMiddleware } from '../auth';
import { CreateFragranceSchema, Fragrance } from '../schemas';
import { getFragrances, saveFragrances } from '../storage';
import { Env } from '../types';

/**
 * Per-account mutexes for concurrent write safety
 * note: Concurrent write risk is probably small, but this prevents it as usage scales. I included this assuming a single region deployment.
 * note: This map grows unbounded (one mutex per accountId, never removed). This is a tiny memory leak, by the time it matters we'd be redesigning the concurrency model anyways :)
 */
const mutexes = new Map<string, Mutex>();

/**
 * Gets or creates a mutex for an account
 */
function getMutex(accountId: string): Mutex {
    let mutex = mutexes.get(accountId);
    if (!mutex) {
        mutex = new Mutex();
        mutexes.set(accountId, mutex);
    }
    return mutex;
}

const fragrances = new Hono<Env>();

fragrances.use('*', authMiddleware);

/**
 * Sets accountId from authenticated user
 */
fragrances.use('*', async (c, next) => {
    const user = c.get('user');
    c.set('accountId', String(user.dat.account_id));
    await next();
});

/**
 * GET /api/fragrances - List all fragrances
 */
fragrances.get('/', async (c) => {
    const accountId = c.get('accountId');
    const items = await getFragrances(accountId);
    return c.json(items);
});

/**
 * POST /api/fragrances - Create a new fragrance
 */
fragrances.post('/', async (c) => {
    const accountId = c.get('accountId');
    let body: unknown;
    try {
        body = await c.req.json();
    } catch (err) {
        return c.json({ error: 'Invalid JSON' }, 400);
    }
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

    return getMutex(accountId).runExclusive(async () => {
        const items = await getFragrances(accountId);
        items.push(newFragrance);
        await saveFragrances(items, accountId);
        return c.json(newFragrance, 201);
    });
});

/**
 * PUT /api/fragrances/:id - Update a fragrance
 */
fragrances.put('/:id', async (c) => {
    const accountId = c.get('accountId');
    const id = c.req.param('id');
    let body: unknown;
    try {
        body = await c.req.json();
    } catch (err) {
        return c.json({ error: 'Invalid JSON' }, 400);
    }
    const result = CreateFragranceSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: result.error.issues }, 422);
    }

    return getMutex(accountId).runExclusive(async () => {
        const items = await getFragrances(accountId);
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) {
            return c.json({ error: 'Not found' }, 404);
        }

        const updated: Fragrance = {
            id: items[index].id,
            ...result.data,
            created_at: items[index].created_at,
            updated_at: new Date().toISOString(),
        };
        items[index] = updated;
        await saveFragrances(items, accountId);

        return c.json(updated);
    });
});

/**
 * DELETE /api/fragrances/:id - Delete a fragrance
 * note: Deleting fragrances from the KV store doesn't remove them from the "fragrances" dropdown menu on the board.
 * Removing them would mean deprecated/inactive fragrances from previous orders lose state.
 */
fragrances.delete('/:id', async (c) => {
    const accountId = c.get('accountId');
    const id = c.req.param('id');

    return getMutex(accountId).runExclusive(async () => {
        const items = await getFragrances(accountId);
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) {
            return c.json({ error: 'Not found' }, 404);
        }

        items.splice(index, 1);
        await saveFragrances(items, accountId);

        return c.body(null, 204);
    });
});

export default fragrances;
