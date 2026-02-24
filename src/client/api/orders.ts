/**
 * Orders API
 * Submit production orders to Monday.com board
 */

import { client } from './client';

/**
 * Box data in order payload
 */
export interface OrderBox {
    inscription: string;
    fragrance_ids: [string, string, string]; // Exactly 3, all unique
}

/**
 * Order submission payload (matches backend CreateOrderSchema)
 */
export interface OrderPayload {
    boardId: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    shipping_address: string;
    boxes: OrderBox[];
}

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
    return client.post<OrderResponse>('/api/orders', payload);
}
