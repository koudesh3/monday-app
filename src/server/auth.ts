import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { EnvironmentVariablesManager } from '@mondaycom/apps-sdk';

const envManager = new EnvironmentVariablesManager();

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);
  const signingSecret = envManager.get('MONDAY_SIGNING_SECRET');

  if (!signingSecret) {
    return c.json({ error: 'Server misconfigured: missing signing secret' }, 500);
  }

  try {
    const payload = jwt.verify(token, signingSecret as string);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
}
