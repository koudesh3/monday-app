/**
 * useMondayContext
 * Handles Monday SDK initialization and context extraction
 */

import { useState, useEffect } from 'react';
import { setAuthToken } from '../api/client';
import { mockBoardId, mockSessionToken } from '../mocks/data';
import mondaySdk from 'monday-sdk-js';

const monday = mondaySdk();

// Check if mock mode is enabled
const isMockMode = process.env.MOCK_MODE === 'true';

export interface MondayContext {
    boardId: number | null;
    token: string | null;
    ready: boolean;
    error: string | null;
}

/**
 * Initialize Monday SDK and extract context
 * - Gets sessionToken (JWT) from Monday SDK
 * - Gets boardId from context
 * - Sets auth token for API client
 * - Returns ready state once both are available
 *
 * In mock mode (MOCK_MODE=true), returns mock data immediately
 */
export function useMondayContext(): MondayContext {
    const [boardId, setBoardId] = useState<number | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function initialize() {
            try {
                // Mock mode: skip Monday SDK and use mock data
                if (isMockMode) {
                    console.log('🎭 Mock mode enabled - using mock data for local development');
                    setAuthToken(mockSessionToken);
                    setToken(mockSessionToken);
                    setBoardId(mockBoardId);
                    setReady(true);
                    setError(null);
                    return;
                }

                // Production mode: use Monday SDK
                // Get session token (JWT signed with CLIENT_SECRET) to authenticate requests to our backend
                // note: This cannot not used to authenticate monday API calls
                const tokenResult = await monday.get('sessionToken');
                const sessionToken = tokenResult.data;

                // Get board context
                const contextResult = await monday.get('context');
                const context = contextResult.data;

                // Runtime validation instead of type assertion
                if (!context || typeof context !== 'object') {
                    throw new Error('Board context not available');
                }

                if (!('boardId' in context)) {
                    throw new Error('Board context missing boardId');
                }

                const boardIdValue = (context as Record<string, unknown>).boardId;
                const parsedBoardId = Number(boardIdValue);

                if (!Number.isInteger(parsedBoardId) || parsedBoardId <= 0) {
                    throw new Error('Invalid boardId in context');
                }

                // Set token for API client
                setAuthToken(sessionToken);
                setToken(sessionToken);
                setBoardId(parsedBoardId);
                setReady(true);
                setError(null);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to initialize Monday context';
                console.error('Monday context initialization error:', err);
                setError(message);
                setReady(false);
            }
        }

        initialize();
    }, []);

    return { boardId, token, ready, error };
}
