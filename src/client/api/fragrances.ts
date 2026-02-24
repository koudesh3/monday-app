/**
 * Fragrances API
 * CRUD operations for the fragrance catalog
 */

import { client } from './client';

/**
 * Fragrance type (matches backend schema)
 */
export interface Fragrance {
    id: string;
    name: string;
    description: string;
    category: string;
    image_url?: string;
    recipe: string;
    created_at: string;
    updated_at: string;
}

/**
 * Form data for creating/updating fragrances
 * (omits id, timestamps)
 */
export type FragranceForm = Omit<Fragrance, 'id' | 'created_at' | 'updated_at'>;

/**
 * Get all fragrances for the current account
 */
export async function getAll(): Promise<Fragrance[]> {
    return client.get<Fragrance[]>('/api/fragrances');
}

/**
 * Create a new fragrance
 */
export async function create(form: FragranceForm): Promise<Fragrance> {
    return client.post<Fragrance>('/api/fragrances', form);
}

/**
 * Update an existing fragrance
 */
export async function update(id: string, form: FragranceForm): Promise<Fragrance> {
    return client.put<Fragrance>(`/api/fragrances/${id}`, form);
}

/**
 * Delete a fragrance
 */
export async function remove(id: string): Promise<void> {
    return client.delete<void>(`/api/fragrances/${id}`);
}
