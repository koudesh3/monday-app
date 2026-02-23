/**
 * useOrder
 * Manages order submission via API using TanStack Query
 */

import { useMutation } from '@tanstack/react-query';
import * as ordersApi from '../api/orders';
import type { OrderPayload, OrderResponse } from '../api/orders';

export interface UseOrderResult {
  submitting: boolean;
  submitted: boolean;
  error: string | null;
  response: OrderResponse | null;
  submit: (payload: OrderPayload) => Promise<void>;
  reset: () => void;
}

/**
 * Handle order submission
 * - Uses TanStack Query mutation for order submission
 * - On success, sets submitted: true and stores response
 * - On failure, sets error with message
 * - reset() clears mutation state (for "New Order" flow)
 */
export function useOrder(): UseOrderResult {
  const mutation = useMutation({
    mutationFn: ordersApi.submitOrder,
    onError: (err) => {
      console.error('Order submission error:', err);
    },
  });

  const submit = async (payload: OrderPayload) => {
    await mutation.mutateAsync(payload);
  };

  const reset = () => {
    mutation.reset();
  };

  return {
    submitting: mutation.isPending,
    submitted: mutation.isSuccess,
    error: mutation.error ? (mutation.error instanceof Error ? mutation.error.message : 'Failed to submit order') : null,
    response: mutation.data ?? null,
    submit,
    reset,
  };
}
