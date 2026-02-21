import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'local-dev-secret-change-in-production';
const TEST_TOKEN = jwt.sign({ dat: { account_id: 12345, user_id: 67890, shortLivedToken: 'mock-slt' } }, TEST_SECRET);

let mockFragrances: any[] = [];

const mockCreateOrderItem = vi.fn();
const mockCreateBoxSubitem = vi.fn();

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

vi.mock('../src/server/monday-api', () => ({
  createItem: (...args: any[]) => mockCreateOrderItem(...args),
  createSubitem: (...args: any[]) => mockCreateBoxSubitem(...args),
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

describe('Order API', () => {
  beforeEach(() => {
    mockFragrances = [
      makeFragrance('f1', 'Lavender'),
      makeFragrance('f2', 'Rose'),
      makeFragrance('f3', 'Vanilla'),
      makeFragrance('f4', 'Sandalwood'),
    ];
    mockCreateOrderItem.mockReset();
    mockCreateBoxSubitem.mockReset();
    mockCreateOrderItem.mockResolvedValue('item-100');
    mockCreateBoxSubitem.mockResolvedValue('sub-1');
  });

  it('valid order with 1 box creates item and 1 subitem, returns 201 with ids', async () => {
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId: 12345,
        first_name: 'Jane',
        last_name: 'Doe',
        boxes: [{ inscription: 'Happy Birthday', fragrance_ids: ['f1', 'f2', 'f3'] }],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.itemId).toBe('item-100');
    expect(body.subitemIds).toHaveLength(1);
  });

  it('valid order with 3 boxes creates item and 3 subitems', async () => {
    mockCreateBoxSubitem
      .mockResolvedValueOnce('sub-1')
      .mockResolvedValueOnce('sub-2')
      .mockResolvedValueOnce('sub-3');

    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId: 12345,
        first_name: 'Jane',
        last_name: 'Doe',
        boxes: [
          { inscription: 'Box A', fragrance_ids: ['f1', 'f2', 'f3'] },
          { inscription: 'Box B', fragrance_ids: ['f2', 'f3', 'f4'] },
          { inscription: 'Box C', fragrance_ids: ['f1', 'f3', 'f4'] },
        ],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.itemId).toBe('item-100');
    expect(body.subitemIds).toEqual(['sub-1', 'sub-2', 'sub-3']);
  });

  it('invalid body returns 422', async () => {
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: 12345, first_name: 'Jane' }),
    });
    expect(res.status).toBe(422);
  });

  it('unknown fragrance id in any box returns 422', async () => {
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId: 12345,
        first_name: 'Jane',
        last_name: 'Doe',
        boxes: [{ inscription: 'Gift', fragrance_ids: ['f1', 'f2', 'UNKNOWN'] }],
      }),
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain('UNKNOWN');
  });

  it('missing Authorization returns 401', async () => {
    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId: 12345,
        first_name: 'Jane',
        last_name: 'Doe',
        boxes: [{ inscription: 'Gift', fragrance_ids: ['f1', 'f2', 'f3'] }],
      }),
    });
    expect(res.status).toBe(401);
  });

  it('createOrderItem is called with the correct board id and full name', async () => {
    await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId: 12345,
        first_name: 'Jane',
        last_name: 'Doe',
        boxes: [{ inscription: 'Gift', fragrance_ids: ['f1', 'f2', 'f3'] }],
      }),
    });
    expect(mockCreateOrderItem).toHaveBeenCalledWith({
      boardId: 12345,
      itemName: 'Jane Doe',
      token: 'mock-slt',
    });
  });

  it('createBoxSubitem is called once per box with correct inscription and resolved fragrance names', async () => {
    mockCreateBoxSubitem
      .mockResolvedValueOnce('sub-1')
      .mockResolvedValueOnce('sub-2');

    await app.request('/api/orders', {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId: 12345,
        first_name: 'Jane',
        last_name: 'Doe',
        boxes: [
          { inscription: 'Box A', fragrance_ids: ['f1', 'f2', 'f3'] },
          { inscription: 'Box B', fragrance_ids: ['f2', 'f3', 'f4'] },
        ],
      }),
    });
    expect(mockCreateBoxSubitem).toHaveBeenCalledTimes(2);
    expect(mockCreateBoxSubitem).toHaveBeenCalledWith({
      parentItemId: 'item-100',
      boxNumber: 1,
      inscription: 'Box A',
      fragranceNames: ['Lavender', 'Rose', 'Vanilla'],
      token: 'mock-slt',
    });
    expect(mockCreateBoxSubitem).toHaveBeenCalledWith({
      parentItemId: 'item-100',
      boxNumber: 2,
      inscription: 'Box B',
      fragranceNames: ['Rose', 'Vanilla', 'Sandalwood'],
      token: 'mock-slt',
    });
  });
});
