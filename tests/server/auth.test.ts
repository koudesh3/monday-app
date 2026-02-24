import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../src/server/auth';
import { Env } from '../../src/server/types';

const TEST_SECRET = process.env.MONDAY_CLIENT_SECRET || 'test-secret';
const TEST_ACCOUNT_ID = 12345;
const TEST_USER_ID = 67890;

vi.mock('@mondaycom/apps-sdk', () => ({
    Logger: class {
        info() { }
        error() { }
        warn() { }
        debug() { }
    },
}));

describe('Auth Middleware', () => {
    let app: Hono<Env>;

    beforeEach(() => {
        app = new Hono<Env>();
        app.use('*', authMiddleware);
        app.get('/test', (c) => {
            const user = c.get('user');
            return c.json({ accountId: user.dat.account_id, userId: user.dat.user_id });
        });
    });

    it('allows request with valid JWT token and sets user context', async () => {
        // Arrange
        const token = jwt.sign(
            { dat: { account_id: TEST_ACCOUNT_ID, user_id: TEST_USER_ID, shortLivedToken: 'mock-slt' } },
            TEST_SECRET
        );

        // Act
        const res = await app.request('/test', {
            headers: { Authorization: `Bearer ${token}` },
        });

        // Assert
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.accountId).toBe(TEST_ACCOUNT_ID);
        expect(body.userId).toBe(TEST_USER_ID);
    });

    it('returns 401 when Authorization header is missing', async () => {
        // Arrange - no Authorization header

        // Act
        const res = await app.request('/test');

        // Assert
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe('Missing or invalid Authorization header');
    });

    it('returns 401 when Authorization header does not start with Bearer', async () => {
        // Arrange
        const token = jwt.sign({ dat: { account_id: TEST_ACCOUNT_ID } }, TEST_SECRET);

        // Act
        const res = await app.request('/test', {
            headers: { Authorization: `Token ${token}` },
        });

        // Assert
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe('Missing or invalid Authorization header');
    });

    it('returns 401 when JWT signature is invalid', async () => {
        // Arrange
        const token = jwt.sign({ dat: { account_id: TEST_ACCOUNT_ID } }, 'wrong-secret');

        // Act
        const res = await app.request('/test', {
            headers: { Authorization: `Bearer ${token}` },
        });

        // Assert
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe('Invalid token');
    });

    it('returns 401 when JWT payload has invalid schema', async () => {
        // Arrange - missing required fields in payload
        const token = jwt.sign({ dat: { account_id: TEST_ACCOUNT_ID } }, TEST_SECRET);

        // Act
        const res = await app.request('/test', {
            headers: { Authorization: `Bearer ${token}` },
        });

        // Assert
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe('Invalid token');
    });
});
