/**
 * Unit tests for useSearch hook and filterItems function
 */

import { describe, it, expect } from 'vitest';
import { filterItems } from '../../src/client/hooks/useSearch';

describe('filterItems', () => {
    const items = [
        { id: 1, name: 'Lavender Dream', category: 'Floral', description: 'Calming lavender' },
        { id: 2, name: 'Ocean Breeze', category: 'Fresh', description: 'Fresh ocean air' },
        { id: 3, name: 'Pine Forest', category: 'Woody', description: 'Earthy pine scent' },
        { id: 4, name: 'Citrus Burst', category: 'Citrus', description: 'Bright and zesty' },
    ];

    it('should return all items when query is empty', () => {
        expect(filterItems(items, ['name', 'category'], '')).toEqual(items);
    });

    it('should return all items when query is whitespace', () => {
        expect(filterItems(items, ['name', 'category'], '   ')).toEqual(items);
    });

    it('should filter by name (case-insensitive)', () => {
        const result = filterItems(items, ['name', 'category'], 'lavender');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Lavender Dream');
    });

    it('should filter by name with mixed case', () => {
        const result = filterItems(items, ['name', 'category'], 'OCEAN');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Ocean Breeze');
    });

    it('should filter by category', () => {
        const result = filterItems(items, ['name', 'category'], 'fresh');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Ocean Breeze');
    });

    it('should filter by description when included in keys', () => {
        const result = filterItems(items, ['name', 'description'], 'earthy');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Pine Forest');
    });

    it('should not filter by description when not included in keys', () => {
        const result = filterItems(items, ['name', 'category'], 'earthy');
        expect(result).toHaveLength(0);
    });

    it('should return multiple matches', () => {
        const result = filterItems(items, ['name', 'category', 'description'], 'fresh');
        expect(result).toHaveLength(1); // Only "Ocean Breeze" has "fresh" in its fields
    });

    it('should return empty array when no matches', () => {
        const result = filterItems(items, ['name', 'category'], 'nonexistent');
        expect(result).toHaveLength(0);
    });

    it('should handle partial matches', () => {
        const result = filterItems(items, ['name'], 'dream');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Lavender Dream');
    });

    it('should handle multiple fields with same query', () => {
        const result = filterItems(items, ['name', 'category', 'description'], 'Forest');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Pine Forest');
    });

    it('should handle empty items array', () => {
        const result = filterItems([], ['name'], 'test');
        expect(result).toHaveLength(0);
    });

    it('should ignore non-string fields', () => {
        const itemsWithNumbers = [
            { id: 1, name: 'Test', count: 123 },
            { id: 2, name: 'Another', count: 456 },
        ];
        const result = filterItems(itemsWithNumbers, ['name', 'count' as keyof typeof itemsWithNumbers[0]], '123');
        expect(result).toHaveLength(0); // count is a number, not a string
    });

    it('should handle special characters in query', () => {
        const specialItems = [
            { id: 1, name: 'Item-1', category: 'Test' },
            { id: 2, name: 'Item (2)', category: 'Test' },
        ];
        const result = filterItems(specialItems, ['name'], 'Item-1');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Item-1');
    });
});
