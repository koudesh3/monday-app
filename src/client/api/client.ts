/**
 * API Client - Base fetch wrapper
 * Handles auth header injection, JSON parsing, and error handling
 */

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Global token storage.
 * Set via setAuthToken() during app initialization.
 */
// note: let authToken is global mutable state
let authToken: string | null = null;

/**
 * Set the authentication token for all API requests.
 * Call this once during app initialization after getting the session token from Monday SDK.
 */
export function setAuthToken(token: string | null) {
    authToken = token;
}

/**
 * Get the current authentication token.
 * Util used for testing token storage
 */
export function getAuthToken(): string | null {
    return authToken;
}

/**
 * Base fetch wrapper with auth header and error handling
 */
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    // Build headers object with optional auth token
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    const response = await fetch(endpoint, {
        ...options,
        headers,
    });

    // Handle 204 No Content (DELETE success)
    if (response.status === 204) {
        return undefined as T;
    }

    // Parse JSON response
    const data = await response.json();

    // Handle non-2xx responses
    if (!response.ok) {
        throw new ApiError(
            data.error || `API error: ${response.status}`,
            response.status,
            data
        );
    }

    return data;
}

/**
 * HTTP method helpers
 */
export const client = {
    get: <T>(endpoint: string) =>
        apiFetch<T>(endpoint, { method: 'GET' }),

    post: <T>(endpoint: string, body: unknown) =>
        apiFetch<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    put: <T>(endpoint: string, body: unknown) =>
        apiFetch<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        }),

    delete: (endpoint: string): Promise<void> =>
        apiFetch<void>(endpoint, { method: 'DELETE' }),
};