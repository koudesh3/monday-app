import { useState, useEffect } from 'react';
import type { MondayClientSdk } from 'monday-sdk-js';
import { FragranceOption } from './components/FragrancePicker';
import { mockFragrances } from './mockData';

type UseFragrancesResult = {
  fragrances: FragranceOption[];
  loading: boolean;
  error: string | null;
};

export function useFragrances(monday: MondayClientSdk): UseFragrancesResult {
  const [fragrances, setFragrances] = useState<FragranceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFragrances() {
      try {
        const result = await monday.get('sessionToken');
        const sessionToken = result.data;

        if (typeof sessionToken !== 'string') {
          // In development, fall back to mock data when not running in Monday iframe
          if (process.env.NODE_ENV === 'development') {
            console.warn('No valid session token (not in Monday iframe), using mock data');
            setFragrances(mockFragrances);
            setError(null);
            setLoading(false);
            return;
          }
          throw new Error('Invalid session token received from monday SDK');
        }

        const response = await fetch('/api/fragrances', {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // In development, fall back to mock data for easier testing
            if (process.env.NODE_ENV === 'development') {
              console.warn('Not authenticated, using mock data for development');
              setFragrances(mockFragrances);
              setError(null);
              return;
            }
            // In production, 401 is a real error (invalid/expired session token)
            throw new Error('Authentication failed');
          }
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }
        // Map backend Fragrance to frontend FragranceOption
        setFragrances(data.map(item => ({ id: item.id, name: item.name })));
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load fragrances';
        console.error('Error loading fragrances:', err);
        setError(message);
        setFragrances([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFragrances();
  }, [monday]);

  return { fragrances, loading, error };
}
