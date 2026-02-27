/**
 * Type-safe error handling utilities
 */

/**
 * Type-safe error information extraction
 */
export interface ErrorInfo {
    message: string;
    status?: number;
    response?: unknown;
    stack?: string;
}

/**
 * Safely extracts error information from unknown error objects
 * Handles GraphQL/HTTP errors with response.status property
 */
export function getErrorInfo(err: unknown): ErrorInfo {
    if (err instanceof Error) {
        return {
            message: err.message,
            status: isErrorWithStatus(err) ? err.response?.status : undefined,
            response: isErrorWithResponse(err) ? err.response : undefined,
            stack: err.stack,
        };
    }
    return {
        message: String(err),
    };
}

/**
 * Type guard for errors with response.status (GraphQL/HTTP errors)
 */
function isErrorWithStatus(err: unknown): err is Error & { response?: { status?: number } } {
    return (
        err instanceof Error &&
        typeof (err as any).response === 'object' &&
        (err as any).response !== null
    );
}

/**
 * Type guard for errors with response property
 */
function isErrorWithResponse(err: unknown): err is Error & { response?: unknown } {
    return err instanceof Error && 'response' in err;
}
