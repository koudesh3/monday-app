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

const mockCreateItem = vi.fn();
const mockCreateSubitem = vi.fn();

vi.mock('../../src/server/mondayClient', () => ({
    createItem: (...args: any[]) => mockCreateItem(...args),
    createSubitem: (...args: any[]) => mockCreateSubitem(...args),
}));

import { app } from '../../src/server/server';

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
        mockCreateItem.mockReset();
        mockCreateSubitem.mockReset();
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

    it('creates order with item and subitems and returns 201', async () => {
        // Arrange
        mockCreateItem.mockResolvedValue('item-123');
        mockCreateSubitem.mockResolvedValue('subitem-456');
        const validBody = {
            ...validOrderBase(),
            boxes: [
                { inscription: 'Happy Birthday!', fragrance_ids: ['f1', 'f2', 'f3'] },
                { inscription: 'For Mom', fragrance_ids: ['f2', 'f3', 'f4'] },
            ],
        };

        // Act
        const res = await app.request('/api/orders', {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(validBody),
        });

        // Assert
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.orderId).toMatch(/^ORD-[a-z0-9]{8}$/);
        expect(body.itemId).toBe('item-123');
        expect(body.subitemIds).toHaveLength(2);
        expect(mockCreateItem).toHaveBeenCalledTimes(1);
        expect(mockCreateSubitem).toHaveBeenCalledTimes(2);
    });

    it('returns 500 when item creation fails after retries', async () => {
        // Arrange
        mockCreateItem.mockRejectedValue(new Error('Monday API error'));
        const validBody = {
            ...validOrderBase(),
            boxes: [{ inscription: 'Gift', fragrance_ids: ['f1', 'f2', 'f3'] }],
        };

        // Act
        const res = await app.request('/api/orders', {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(validBody),
        });

        // Assert
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toBe('Failed to create order item after retries');
    }, 15000);

    it('returns 500 when subitem creation fails after retries', async () => {
        // Arrange
        mockCreateItem.mockResolvedValue('item-123');
        mockCreateSubitem.mockRejectedValue(new Error('Monday API error'));
        const validBody = {
            ...validOrderBase(),
            boxes: [{ inscription: 'Gift', fragrance_ids: ['f1', 'f2', 'f3'] }],
        };

        // Act
        const res = await app.request('/api/orders', {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(validBody),
        });

        // Assert
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toBe('Failed to create subitems after retries');
        expect(body.itemId).toBe('item-123');
    }, 15000);
});
