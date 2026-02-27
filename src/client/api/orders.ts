/**
 * Orders API
 * Submit production orders to Monday.com board
 */

import { client } from './client';
import type { Box, CreateOrder } from '../../shared/schemas';

// Check if mock mode is enabled
const isMockMode = process.env.MOCK_MODE === 'true';

/**
 * Order submission payload (matches backend CreateOrderSchema)
 */
export type OrderPayload = CreateOrder;

/**
 * Box data in order payload (re-export for convenience)
 */
export type OrderBox = Box;

/**
 * Order submission response
 */
export interface OrderResponse {
    orderId: string;
    itemId: string;
    subitemIds: string[];
}

/**
 * Submit a production order
 * Creates a Monday.com item with subitems for each box
 */
export async function submitOrder(payload: OrderPayload): Promise<OrderResponse> {
    if (isMockMode) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate mock IDs
        const orderId = `MOCK-${Date.now()}`;
        const itemId = String(Date.now());
        const subitemIds = payload.boxes.map((_, i) => String(Date.now() + i + 1));

        console.log('🎭 Mock order submitted:', { orderId, payload });

        return {
            orderId,
            itemId,
            subitemIds,
        };
    }

    return client.post<OrderResponse>('/api/orders', payload);
}
