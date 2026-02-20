import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

export type SessionUser = {
  dat: {
    account_id: number;
    user_id: number;
    shortLivedToken: string;
  };
};

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);
  const signingSecret = process.env.MONDAY_SIGNING_SECRET;

  if (!signingSecret) {
    return c.json({ error: 'Server misconfigured: missing signing secret' }, 500);
  }

  try {
    const payload = jwt.verify(token, signingSecret) as SessionUser;
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
}
