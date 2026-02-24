import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Fragrance } from '../../src/server/schemas';

const mockStorage = new Map<string, any>();

vi.mock('@mondaycom/apps-sdk', () => ({
    Logger: class {
        info() { }
        error() { }
        warn() { }
        debug() { }
    },
    SecureStorage: class {
        async get(key: string) {
            return mockStorage.get(key);
        }
        async set(key: string, value: any) {
            mockStorage.set(key, value);
            return true;
        }
    },
}));

import { getFragrances, saveFragrances } from '../../src/server/storage';

describe('Storage', () => {
    beforeEach(() => {
        mockStorage.clear();
    });

    describe('getFragrances', () => {
        it('returns empty array when no fragrances stored', async () => {
            // Arrange - empty storage

            // Act
            const result = await getFragrances('12345');

            // Assert
            expect(result).toEqual([]);
        });

        it('returns stored fragrances for an account', async () => {
            // Arrange
            const fragrances: Fragrance[] = [
                {
                    id: 'abc',
                    name: 'Lavender',
                    description: 'Calming',
                    category: 'Floral',
                    image_url: 'https://example.com/img.jpg',
                    recipe: 'Oil blend',
                    created_at: '2024-01-01T00:00:00.000Z',
                    updated_at: '2024-01-01T00:00:00.000Z',
                },
            ];
            mockStorage.set('fragrances_12345', fragrances);

            // Act
            const result = await getFragrances('12345');

            // Assert
            expect(result).toEqual(fragrances);
        });

        it('isolates data by account ID', async () => {
            // Arrange
            const account1Fragrances: Fragrance[] = [
                {
                    id: 'abc',
                    name: 'Lavender',
                    description: 'Calming',
                    category: 'Floral',
                    image_url: 'https://example.com/img.jpg',
                    recipe: 'Oil blend',
                    created_at: '2024-01-01T00:00:00.000Z',
                    updated_at: '2024-01-01T00:00:00.000Z',
                },
            ];
            const account2Fragrances: Fragrance[] = [
                {
                    id: 'def',
                    name: 'Rose',
                    description: 'Romantic',
                    category: 'Floral',
                    image_url: 'https://example.com/rose.jpg',
                    recipe: 'Rose oil',
                    created_at: '2024-01-01T00:00:00.000Z',
                    updated_at: '2024-01-01T00:00:00.000Z',
                },
            ];
            mockStorage.set('fragrances_12345', account1Fragrances);
            mockStorage.set('fragrances_67890', account2Fragrances);

            // Act
            const result1 = await getFragrances('12345');
            const result2 = await getFragrances('67890');

            // Assert
            expect(result1).toEqual(account1Fragrances);
            expect(result2).toEqual(account2Fragrances);
        });
    });

    describe('saveFragrances', () => {
        it('saves fragrances for an account', async () => {
            // Arrange
            const fragrances: Fragrance[] = [
                {
                    id: 'abc',
                    name: 'Lavender',
                    description: 'Calming',
                    category: 'Floral',
                    image_url: 'https://example.com/img.jpg',
                    recipe: 'Oil blend',
                    created_at: '2024-01-01T00:00:00.000Z',
                    updated_at: '2024-01-01T00:00:00.000Z',
                },
            ];

            // Act
            await saveFragrances(fragrances, '12345');

            // Assert
            const stored = await getFragrances('12345');
            expect(stored).toEqual(fragrances);
        });

        it('overwrites existing fragrances for an account', async () => {
            // Arrange
            const oldFragrances: Fragrance[] = [
                {
                    id: 'abc',
                    name: 'Old',
                    description: 'Old desc',
                    category: 'Floral',
                    image_url: 'https://example.com/old.jpg',
                    recipe: 'Old recipe',
                    created_at: '2024-01-01T00:00:00.000Z',
                    updated_at: '2024-01-01T00:00:00.000Z',
                },
            ];
            const newFragrances: Fragrance[] = [
                {
                    id: 'def',
                    name: 'New',
                    description: 'New desc',
                    category: 'Citrus',
                    image_url: 'https://example.com/new.jpg',
                    recipe: 'New recipe',
                    created_at: '2024-01-02T00:00:00.000Z',
                    updated_at: '2024-01-02T00:00:00.000Z',
                },
            ];
            await saveFragrances(oldFragrances, '12345');

            // Act
            await saveFragrances(newFragrances, '12345');

            // Assert
            const stored = await getFragrances('12345');
            expect(stored).toEqual(newFragrances);
        });
    });
});
