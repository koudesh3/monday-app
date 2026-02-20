import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret';
const TEST_TOKEN = jwt.sign({ dat: { account_id: 12345, user_id: 67890, shortLivedToken: 'mock-slt' } }, TEST_SECRET);

let mockFragrances: any[] = [];

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
    mockFragrances = [];
  });

  it('GET /api/fragrances returns empty array when no fragrances stored', async () => {
    const res = await app.request('/api/fragrances', {
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('GET /api/fragrances returns existing fragrances', async () => {
    mockFragrances = [
      { id: '1', ...validBody, created_at: '2024-01-01T00:00:00.000Z', updated_at: '2024-01-01T00:00:00.000Z' },
    ];
    const res = await app.request('/api/fragrances', {
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Lavender');
  });

  it('POST /api/fragrances with valid body creates and returns a new fragrance with generated id and timestamps', async () => {
    const res = await app.request('/api/fragrances', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe('Lavender');
    expect(body.created_at).toBeDefined();
    expect(body.updated_at).toBeDefined();
    expect(mockFragrances).toHaveLength(1);
  });

  it('POST /api/fragrances with invalid body returns 422', async () => {
    const res = await app.request('/api/fragrances', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Missing fields' }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('PUT /api/fragrances/:id updates an existing fragrance', async () => {
    mockFragrances = [
      { id: 'abc', ...validBody, created_at: '2024-01-01T00:00:00.000Z', updated_at: '2024-01-01T00:00:00.000Z' },
    ];
    const updatedBody = { ...validBody, name: 'Rose' };
    const res = await app.request('/api/fragrances/abc', {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBody),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Rose');
    expect(body.id).toBe('abc');
    expect(body.created_at).toBe('2024-01-01T00:00:00.000Z');
    expect(body.updated_at).not.toBe('2024-01-01T00:00:00.000Z');
  });

  it('PUT /api/fragrances/:id returns 404 for unknown id', async () => {
    const res = await app.request('/api/fragrances/nonexistent', {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/fragrances/:id removes a fragrance and returns 204', async () => {
    mockFragrances = [
      { id: 'abc', ...validBody, created_at: '2024-01-01T00:00:00.000Z', updated_at: '2024-01-01T00:00:00.000Z' },
    ];
    const res = await app.request('/api/fragrances/abc', {
      method: 'DELETE',
      headers: authHeader(),
    });
    expect(res.status).toBe(204);
    expect(mockFragrances).toHaveLength(0);
  });

  it('DELETE /api/fragrances/:id returns 404 for unknown id', async () => {
    const res = await app.request('/api/fragrances/nonexistent', {
      method: 'DELETE',
      headers: authHeader(),
    });
    expect(res.status).toBe(404);
  });

  it('Any route without Authorization header returns 401', async () => {
    const res = await app.request('/api/fragrances');
    expect(res.status).toBe(401);
  });
});
