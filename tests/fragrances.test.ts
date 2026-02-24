import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Read the actual secret from env since config.ts is loaded before mocks
const TEST_SECRET = process.env.MONDAY_CLIENT_SECRET || 'test-secret';
const TEST_ACCOUNT_ID = 12345;
const TEST_TOKEN = jwt.sign({ dat: { account_id: TEST_ACCOUNT_ID, user_id: 67890, shortLivedToken: 'mock-slt' } }, TEST_SECRET);

// Use a Map to properly isolate storage by account ID and validate keys
const mockStorage = new Map<string, any[]>();

vi.mock('@mondaycom/apps-sdk', () => ({
  Logger: class {
    info() {}
    error() {}
    warn() {}
    debug() {}
  },
  EnvironmentVariablesManager: class {
    get(key: string) {
      if (key === 'MONDAY_SIGNING_SECRET') return TEST_SECRET;
      return undefined;
    }
  },
  SecureStorage: class {
    async get(key: string) {
      return mockStorage.get(key) || [];
    }
    async set(key: string, value: any) {
      mockStorage.set(key, value);
      return true;
    }
    async delete(key: string) {
      mockStorage.delete(key);
      return true;
    }
  },
}));

import { app } from '../src/server/server';

const validBody = {
  name: 'Lavender',
  description: 'A calming scent',
  category: 'Floral',
  image_url: 'https://example.com/lavender.jpg',
  recipe: 'Lavender oil blend',
};

function authHeader() {
  return { Authorization: `Bearer ${TEST_TOKEN}` };
}

describe('Fragrance API', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  // Note: These tests do not exercise the mutex for concurrent writes.
  // Testing race conditions would require more sophisticated async test helpers.

  it('GET /api/fragrances returns empty array when no fragrances stored', async () => {
    // Arrange - no fragrances in storage

    // Act
    const res = await app.request('/api/fragrances', {
      headers: authHeader(),
    });

    // Assert
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('POST /api/fragrances with valid body creates and returns a new fragrance with generated id and timestamps', async () => {
    // Arrange - no fragrances in storage

    // Act
    const res = await app.request('/api/fragrances', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    // Assert
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe('Lavender');
    expect(body.created_at).toBeDefined();
    expect(body.updated_at).toBeDefined();

    // Verify the fragrance persisted by fetching it
    const getRes = await app.request('/api/fragrances', {
      headers: authHeader(),
    });
    const fragrances = await getRes.json();
    expect(fragrances).toHaveLength(1);
    expect(fragrances[0].id).toBe(body.id);
  });

  it('POST /api/fragrances with invalid body returns 422', async () => {
    // Arrange
    const invalidBody = { name: 'Missing fields' };

    // Act
    const res = await app.request('/api/fragrances', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidBody),
    });

    // Assert
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('POST /api/fragrances with malformed JSON returns 400', async () => {
    // Arrange - malformed JSON string

    // Act
    const res = await app.request('/api/fragrances', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: 'not valid json{',
    });

    // Assert
    expect(res.status).toBe(400);
  });

  it('PUT /api/fragrances/:id updates an existing fragrance', async () => {
    // Arrange
    const existingFragrance = {
      id: 'abc',
      ...validBody,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };
    mockStorage.set(`fragrances_${TEST_ACCOUNT_ID}`, [existingFragrance]);
    const updatedBody = { ...validBody, name: 'Rose' };

    // Act
    const res = await app.request('/api/fragrances/abc', {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBody),
    });

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Rose');
    expect(body.id).toBe('abc');
    expect(body.created_at).toBe('2024-01-01T00:00:00.000Z');
    expect(body.updated_at).not.toBe('2024-01-01T00:00:00.000Z');

    // Verify the update persisted
    const getRes = await app.request('/api/fragrances', {
      headers: authHeader(),
    });
    const fragrances = await getRes.json();
    expect(fragrances[0].name).toBe('Rose');
  });

  it('PUT /api/fragrances/:id with invalid body returns 422', async () => {
    // Arrange
    const existingFragrance = {
      id: 'abc',
      ...validBody,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };
    mockStorage.set(`fragrances_${TEST_ACCOUNT_ID}`, [existingFragrance]);
    const invalidBody = { name: 'Missing fields' };

    // Act
    const res = await app.request('/api/fragrances/abc', {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidBody),
    });

    // Assert
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('PUT /api/fragrances/:id returns 404 for unknown id', async () => {
    // Arrange - no fragrances in storage

    // Act
    const res = await app.request('/api/fragrances/nonexistent', {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    // Assert
    expect(res.status).toBe(404);
  });

  it('DELETE /api/fragrances/:id removes a fragrance and returns 204', async () => {
    // Arrange
    const existingFragrance = {
      id: 'abc',
      ...validBody,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };
    mockStorage.set(`fragrances_${TEST_ACCOUNT_ID}`, [existingFragrance]);

    // Act
    const res = await app.request('/api/fragrances/abc', {
      method: 'DELETE',
      headers: authHeader(),
    });

    // Assert
    expect(res.status).toBe(204);

    // Verify the fragrance was removed
    const getRes = await app.request('/api/fragrances', {
      headers: authHeader(),
    });
    const fragrances = await getRes.json();
    expect(fragrances).toHaveLength(0);
  });

  it('DELETE /api/fragrances/:id returns 404 for unknown id', async () => {
    // Arrange - no fragrances in storage

    // Act
    const res = await app.request('/api/fragrances/nonexistent', {
      method: 'DELETE',
      headers: authHeader(),
    });

    // Assert
    expect(res.status).toBe(404);
  });

  it('Any route without Authorization header returns 401', async () => {
    // Arrange - no auth header

    // Act
    const res = await app.request('/api/fragrances');

    // Assert
    expect(res.status).toBe(401);
  });
});
