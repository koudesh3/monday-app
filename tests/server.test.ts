import { describe, it, expect, vi } from 'vitest';

vi.mock('@mondaycom/apps-sdk', () => ({
  Logger: class {
    info() {}
    error() {}
    warn() {}
    debug() {}
  },
  EnvironmentVariablesManager: class {
    get(key: string) {
      if (key === 'MONDAY_SIGNING_SECRET') return 'test-secret';
      return undefined;
    }
  },
}));

import { app } from '../src/server';

describe('Server', () => {
  it('GET /health returns 200 with { ok: true }', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it('Unknown route returns 200 (serves index.html catch-all)', async () => {
    const res = await app.request('/some/unknown/route');
    expect(res.status).toBe(200);
  });
});
