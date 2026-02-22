/**
 * useFragrances
 * Fetches and manages the fragrance catalog via API
 */

import { useState, useEffect, useCallback } from 'react';
import * as fragrancesApi from '../api/fragrances';
import type { Fragrance, FragranceForm } from '../api/fragrances';

export interface UseFragrancesResult {
  fragrances: Fragrance[];
  loading: boolean;
  error: string | null;
  add: (form: FragranceForm) => Promise<void>;
  update: (id: string, form: FragranceForm) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Manage fragrance catalog with CRUD operations
 * - Fetches on mount
 * - Add/update/remove modify local state after API success
 * - Refresh re-fetches the full list
 */
export function useFragrances(): UseFragrancesResult {
  const [fragrances, setFragrances] = useState<Fragrance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all fragrances
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await fragrancesApi.getAll();
      setFragrances(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load fragrances';
      console.error('Error fetching fragrances:', err);
      setError(message);
      setFragrances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Add fragrance
  const add = useCallback(async (form: FragranceForm) => {
    const newFragrance = await fragrancesApi.create(form);
    setFragrances((prev) => [...prev, newFragrance]);
  }, []);

  // Update fragrance
  const update = useCallback(async (id: string, form: FragranceForm) => {
    const updated = await fragrancesApi.update(id, form);
    setFragrances((prev) =>
      prev.map((item) => (item.id === id ? updated : item))
    );
  }, []);

  // Remove fragrance
  const remove = useCallback(async (id: string) => {
    await fragrancesApi.remove(id);
    setFragrances((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    fragrances,
    loading,
    error,
    add,
    update,
    remove,
    refresh,
  };
}
