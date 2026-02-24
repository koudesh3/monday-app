import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Read the actual secret from env since config.ts is loaded before mocks
const TEST_SECRET = process.env.MONDAY_CLIENT_SECRET || 'test-secret';
const TEST_TOKEN = jwt.sign({ dat: { account_id: 12345, user_id: 67890, shortLivedToken: 'mock-slt' } }, TEST_SECRET);

let mockFragrances: any[] = [];

vi.mock('@mondaycom/apps-sdk', () => ({
    Logger: class {
        info() { }
        error() { }
        warn() { }
        debug() { }
    },
    EnvironmentVariablesManager: class {
        get(key: string) {
            if (key === 'MONDAY_SIGNING_SECRET') return TEST_SECRET;
            if (key === 'MONDAY_BOARD_ID') return '12345';
            return undefined;
        }
    },
    SecureStorage: class {
        async get(_key: string) {
            return mockFragrances;
        }
        async set(_key: string, value: any) {
            mockFragrances = value;
            return true;
        }
        async delete(_key: string) {
            return true;
        }
    },
}));

vi.mock('../src/server/mondayClient', () => ({
    createItem: vi.fn(),
    createSubitem: vi.fn(),
}));

import { app } from '../src/server/server';

function authHeader() {
    return { Authorization: `Bearer ${TEST_TOKEN}` };
}

function makeFragrance(id: string, name: string) {
    return {
        id,
        name,
        description: 'desc',
        category: 'cat',
        image_url: 'https://example.com/img.jpg',
        recipe: 'recipe',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
    };
}

function validOrderBase() {
    return {
        boardId: 12345,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '555-012-3456',
        shipping_address: '123 Main St, City, State 12345',
    };
}

describe('Order API', () => {
    beforeEach(() => {
        mockFragrances = [
            makeFragrance('f1', 'Lavender'),
            makeFragrance('f2', 'Rose'),
            makeFragrance('f3', 'Vanilla'),
            makeFragrance('f4', 'Sandalwood'),
        ];
    });

    it('invalid body returns 422', async () => {
        // Arrange
        const invalidBody = { boardId: 12345, first_name: 'Jane' };

        // Act
        const res = await app.request('/api/orders', {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(invalidBody),
        });

        // Assert
        expect(res.status).toBe(422);
    });

    it('unknown fragrance id in any box returns 422', async () => {
        // Arrange
        const bodyWithUnknownFragrance = {
            ...validOrderBase(),
            boxes: [{ inscription: 'Gift', fragrance_ids: ['f1', 'f2', 'UNKNOWN'] }],
        };

        // Act
        const res = await app.request('/api/orders', {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyWithUnknownFragrance),
        });

        // Assert
        expect(res.status).toBe(422);
        const body = await res.json();
        expect(body.error).toContain('UNKNOWN');
    });

    it('missing Authorization returns 401', async () => {
        // Arrange
        const validBody = {
            ...validOrderBase(),
            boxes: [{ inscription: 'Gift', fragrance_ids: ['f1', 'f2', 'f3'] }],
        };

        // Act
        const res = await app.request('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validBody),
        });

        // Assert
        expect(res.status).toBe(401);
    });
});
