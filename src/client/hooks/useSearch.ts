// TODO: One small thing: the keys array as a useMemo dependency will cause recomputation on every render if the caller passes a literal like ['name', 'category'] inline, since it's a new array reference each time. Probably not noticeable with a small list, but if it ever matters, the caller would need to stabilize it with useMemo or a constant.

/**
 * useSearch
 * Generic filtered search over a list with debounce
 */

import { useState, useEffect, useMemo } from 'react';

const DEBOUNCE_MS = 300;

/**
 * Pure filter function (exported for testing)
 * Filters items where any field in keys includes the query (case-insensitive)
 */
export function filterItems<T>(
    items: T[],
    keys: (keyof T)[],
    query: string
): T[] {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase();

    return items.filter((item) =>
        keys.some((key) => {
            const value = item[key];
            if (typeof value === 'string') {
                return value.toLowerCase().includes(lowerQuery);
            }
            return false;
        })
    );
}

export interface UseSearchResult<T> {
    query: string;
    setQuery: (q: string) => void;
    filtered: T[];
}

/**
 * Generic search hook with debounce
 * - query updates immediately for responsive typing
 * - filtered uses debounced query for performance
 * - Pure client-side filtering via filterItems()
 */
export function useSearch<T>(
    items: T[],
    keys: (keyof T)[]
): UseSearchResult<T> {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce query updates
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [query]);

    // Filter items based on debounced query
    const filtered = useMemo(
        () => filterItems(items, keys, debouncedQuery),
        [items, keys, debouncedQuery]
    );

    return {
        query,
        setQuery,
        filtered,
    };
}
