/**
 * Fragrances API
 * CRUD operations for the fragrance catalog
 */

import { client } from './client';
import { mockFragrances } from '../mocks/data';
import type { Fragrance as FragranceType, CreateFragrance } from '../../shared/schemas';

// Check if mock mode is enabled
const isMockMode = process.env.MOCK_MODE === 'true';

// Re-export for convenience
export type Fragrance = FragranceType;

/**
 * Form data for creating/updating fragrances
 * (omits id, timestamps)
 */
export type FragranceForm = CreateFragrance;

// Mock in-memory store for local development
let mockStore = [...mockFragrances];

/**
 * Get all fragrances for the current account
 */
export async function getAll(): Promise<Fragrance[]> {
    if (isMockMode) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return [...mockStore];
    }
    return client.get<Fragrance[]>('/api/fragrances');
}

/**
 * Create a new fragrance
 */
export async function create(form: FragranceForm): Promise<Fragrance> {
    if (isMockMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const newFragrance: Fragrance = {
            ...form,
            id: String(Date.now()),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        mockStore.push(newFragrance);
        return newFragrance;
    }
    return client.post<Fragrance>('/api/fragrances', form);
}

/**
 * Update an existing fragrance
 */
export async function update(id: string, form: FragranceForm): Promise<Fragrance> {
    if (isMockMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const index = mockStore.findIndex(f => f.id === id);
        if (index === -1) {
            throw new Error('Fragrance not found');
        }
        const updated: Fragrance = {
            ...mockStore[index],
            ...form,
            updated_at: new Date().toISOString(),
        };
        mockStore[index] = updated;
        return updated;
    }
    return client.put<Fragrance>(`/api/fragrances/${id}`, form);
}

/**
 * Delete a fragrance
 */
export async function remove(id: string): Promise<void> {
    if (isMockMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        mockStore = mockStore.filter(f => f.id !== id);
        return;
    }
    return client.delete(`/api/fragrances/${id}`);
}
