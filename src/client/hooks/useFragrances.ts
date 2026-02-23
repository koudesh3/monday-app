/**
 * useFragrances
 * Fetches and manages the fragrance catalog via API using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
 * - Uses TanStack Query for automatic caching, deduplication, and refetching
 * - Mutations invalidate queries to refetch from server (no state drift)
 *
 * @param enabled - Whether to fetch fragrances (wait for auth token to be set)
 */
export function useFragrances(enabled: boolean): UseFragrancesResult {
  const queryClient = useQueryClient();

  const { data: fragrances = [], isLoading, error: queryError } = useQuery({
    queryKey: ['fragrances'],
    queryFn: fragrancesApi.getAll,
    enabled,
  });

  const addMutation = useMutation({
    mutationFn: fragrancesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fragrances'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: FragranceForm }) =>
      fragrancesApi.update(id, form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fragrances'] }),
  });

  const removeMutation = useMutation({
    mutationFn: fragrancesApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fragrances'] }),
  });

  const add = async (form: FragranceForm) => {
    await addMutation.mutateAsync(form);
  };

  const update = async (id: string, form: FragranceForm) => {
    await updateMutation.mutateAsync({ id, form });
  };

  const remove = async (id: string) => {
    await removeMutation.mutateAsync(id);
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['fragrances'] });
  };

  return {
    fragrances,
    loading: isLoading,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load fragrances') : null,
    add,
    update,
    remove,
    refresh,
  };
}
