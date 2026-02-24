/**
 * Unit tests for API client
 * Tests auth token management, error handling, and HTTP methods
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError, setAuthToken, getAuthToken, client } from '../../../src/client/api/client';

describe('ApiError', () => {
  it('should create error with message, status, and details', () => {
    // Arrange & Act
    const error = new ApiError('Not found', 404, { field: 'id' });

    // Assert
    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
    expect(error.details).toEqual({ field: 'id' });
    expect(error.name).toBe('ApiError');
  });
});

describe('Auth token management', () => {
  beforeEach(() => {
    setAuthToken(null);
  });

  it('should store and retrieve auth token', () => {
    // Arrange & Act
    setAuthToken('test-token-123');

    // Assert
    expect(getAuthToken()).toBe('test-token-123');
  });

  it('should allow clearing auth token', () => {
    // Arrange
    setAuthToken('test-token');

    // Act
    setAuthToken(null);

    // Assert
    expect(getAuthToken()).toBeNull();
  });
});

describe('HTTP client', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
    setAuthToken(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should make GET request and return parsed JSON', async () => {
      // Arrange
      const mockData = { id: '1', name: 'Test' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      // Act
      const result = await client.get('/api/test');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockData);
    });

    it('should include auth token in headers when set', async () => {
      // Arrange
      setAuthToken('my-token');
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      // Act
      await client.get('/api/test');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer my-token',
        },
      });
    });

    it('should omit auth header when token is null', async () => {
      // Arrange
      setAuthToken(null);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      // Act
      await client.get('/api/test');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('POST requests', () => {
    it('should make POST request with JSON body', async () => {
      // Arrange
      const payload = { name: 'New Item' };
      const mockResponse = { id: '1', ...payload };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      // Act
      const result = await client.post('/api/items', payload);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('PUT requests', () => {
    it('should make PUT request with JSON body', async () => {
      // Arrange
      const payload = { name: 'Updated Item' };
      const mockResponse = { id: '1', ...payload };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      // Act
      const result = await client.put('/api/items/1', payload);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/items/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE requests', () => {
    it('should handle 204 No Content response', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      // Act
      const result = await client.delete('/api/items/1');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/items/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toBeUndefined();
    });

    it('should handle 200 OK response with JSON', async () => {
      // Arrange
      const mockResponse = { deleted: true };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      // Act
      const result = await client.delete('/api/items/1');

      // Assert
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error handling', () => {
    it('should throw ApiError for 400 Bad Request with error message', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid payload' }),
      });

      // Act & Assert
      await expect(client.get('/api/test')).rejects.toThrow(ApiError);
      await expect(client.get('/api/test')).rejects.toThrow('Invalid payload');

      try {
        await client.get('/api/test');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(400);
        expect((err as ApiError).details).toEqual({ error: 'Invalid payload' });
      }
    });

    it('should throw ApiError for 401 Unauthorized', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      // Act & Assert
      await expect(client.post('/api/test', {})).rejects.toThrow('Unauthorized');

      try {
        await client.post('/api/test', {});
      } catch (err) {
        expect((err as ApiError).status).toBe(401);
      }
    });

    it('should throw ApiError for 404 Not Found', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Resource not found' }),
      });

      // Act & Assert
      await expect(client.delete('/api/items/999')).rejects.toThrow('Resource not found');

      try {
        await client.delete('/api/items/999');
      } catch (err) {
        expect((err as ApiError).status).toBe(404);
      }
    });

    it('should use generic error message when error field is missing', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Something went wrong' }),
      });

      // Act & Assert
      await expect(client.get('/api/test')).rejects.toThrow('API error: 500');

      try {
        await client.get('/api/test');
      } catch (err) {
        expect((err as ApiError).status).toBe(500);
        expect((err as ApiError).details).toEqual({ message: 'Something went wrong' });
      }
    });

    it('should throw ApiError for 422 Unprocessable Entity with validation errors', async () => {
      // Arrange
      const validationErrors = {
        error: 'Validation failed',
        fields: { name: 'Required', email: 'Invalid format' },
      };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => validationErrors,
      });

      // Act & Assert
      await expect(client.post('/api/items', {})).rejects.toThrow('Validation failed');

      try {
        await client.post('/api/items', {});
      } catch (err) {
        expect((err as ApiError).status).toBe(422);
        expect((err as ApiError).details).toEqual(validationErrors);
      }
    });
  });
});
