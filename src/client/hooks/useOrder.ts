/**
 * useOrder
 * Manages order submission via API
 */

import { useState, useCallback } from 'react';
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
 * - submit() calls POST /orders with the payload
 * - Caller (App) is responsible for building the payload from UI state
 * - On success, sets submitted: true and stores response
 * - On failure, sets error with message
 * - reset() clears submitted and error (for "New Order" flow)
 */
export function useOrder(): UseOrderResult {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<OrderResponse | null>(null);

  const submit = useCallback(async (payload: OrderPayload) => {
    try {
      setSubmitting(true);
      setError(null);
      const result = await ordersApi.submitOrder(payload);
      setResponse(result);
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit order';
      console.error('Order submission error:', err);
      setError(message);
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSubmitted(false);
    setError(null);
    setResponse(null);
  }, []);

  return {
    submitting,
    submitted,
    error,
    response,
    submit,
    reset,
  };
}
