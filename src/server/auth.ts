import jwt from 'jsonwebtoken';
import { Context, Next } from 'hono';
import { SessionUserSchema } from './schemas';
import { Env } from './types';
import { clientSecret } from './config';

export async function authMiddleware(c: Context<Env>, next: Next) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Missing or invalid Authorization header' }, 401);
    }

    const token = authHeader.slice(7); // After "Bearer "

    try {
        // Temporary logger
        const parts = token.split('.');
        if (parts.length === 3) {
            const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            console.log('JWT header:', JSON.stringify(header));
            console.log('JWT payload (unverified):', JSON.stringify(payload));
        }

        const decoded = jwt.verify(token, clientSecret);
        console.log('decoded JWT payload:', JSON.stringify(decoded));
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