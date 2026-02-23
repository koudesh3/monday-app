/**
 * useMondayContext
 * Handles Monday SDK initialization and context extraction
 */

import { useState, useEffect } from 'react';
import mondaySdk from 'monday-sdk-js';
import { setAuthToken } from '../api/client';

const monday = mondaySdk();

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
 */
export function useMondayContext(): MondayContext {
  const [boardId, setBoardId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        // Get session token (JWT signed with Client Secret, contains account_id and user_id)
        // Used to authenticate requests to our backend only — not for monday API calls
        const tokenResult = await monday.get('sessionToken');
        const sessionToken = tokenResult.data;

        if (typeof sessionToken !== 'string') {
          // Development fallback - set mock values for testing outside Monday iframe
          if (process.env.NODE_ENV === 'development') {
            console.warn('No valid session token (not in Monday iframe), using development mode');
            setToken('dev-token');
            setBoardId(123456789);
            setReady(true);
            return;
          }
          throw new Error('Invalid session token received from Monday SDK');
        }

        // Get board context
        const contextResult = await monday.get('context');
        const context = contextResult.data as { boardId?: number };

        if (!context?.boardId) {
          throw new Error('Board context not available');
        }

        const parsedBoardId = Number(context.boardId);
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
