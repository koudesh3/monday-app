/**
 * Authentication middleware
 * Verifies JWT tokens and extracts user session data
 */

import jwt from 'jsonwebtoken';
import { Context, Next } from 'hono';
import { SessionUserSchema } from './schemas';
import { Env } from './types';
import { clientSecret } from './config';

/**
 * Validates JWT bearer tokens and sets user context
 */
export async function authMiddleware(c: Context<Env>, next: Next) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Missing or invalid Authorization header' }, 401);
    }

    const token = authHeader.slice(7); // After "Bearer "

    try {
        const decoded = jwt.verify(token, clientSecret);
        const result = SessionUserSchema.safeParse(decoded);

        if (!result.success) {
            console.error('JWT payload validation failed:', result.error);
            return c.json({ error: 'Invalid token' }, 401);
        }

        c.set('user', result.data);
        await next();
    } catch (err) {
        console.error('JWT verification failed:', err);
        return c.json({ error: 'Invalid token' }, 401);
    }
}