/**
 * useOrderLines
 * Manages the list of order lines (pure client-side state)
 */

import { useState, useCallback, useMemo } from 'react';
import type { Fragrance } from '../api/fragrances';

export interface OrderLine {
    id: string;
    fragrances: Fragrance[];
    inscription: string;
}

export interface UseOrderLinesResult {
    boxes: OrderLine[];
    addBox: () => void;
    removeBox: (index: number) => void;
    updateBox: (index: number, box: OrderLine) => void;
    setSlot: (boxIndex: number, slotIndex: number, fragrance: Fragrance | null) => void;
    setFragrances: (boxIndex: number, fragrances: Fragrance[]) => void;
    clearFragranceFromAll: (fragranceId: string) => void;
    allComplete: boolean;
}

/**
 * Create an empty box with empty fragrances array and empty inscription
 */
function createEmptyBox(): OrderLine {
    return {
        id: `box-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fragrances: [],
        inscription: '',
    };
}

/**
 * Manage gift boxes with slot selection and inscription
 * - Order lines aren't persisted until order submission
 * - Each line has 3 fragrance slots and an inscription
 * - allComplete is derived: every line has 3 non-null fragrances
 */
export function useOrderLines(): UseOrderLinesResult {
    const [boxes, setBoxes] = useState<OrderLine[]>([createEmptyBox()]);

    // Add a new empty box
    const addBox = useCallback(() => {
        setBoxes((prev) => [...prev, createEmptyBox()]);
    }, []);

    // Remove a box by index
    const removeBox = useCallback((index: number) => {
        setBoxes((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // Replace a box at index
    const updateBox = useCallback((index: number, box: OrderLine) => {
        setBoxes((prev) => prev.map((b, i) => (i === index ? box : b)));
    }, []);

    // Set fragrances for a box (replaces all fragrances)
    const setSlot = useCallback(
        (boxIndex: number, slotIndex: number, fragrance: Fragrance | null) => {
            // slotIndex is ignored now - kept for backward compatibility
            // fragrance is expected to be null (not used in new implementation)
            setBoxes((prev) => {
                const updated = [...prev];
                const box = updated[boxIndex];
                if (!box) return prev;

                updated[boxIndex] = {
                    ...box,
                    fragrances: box.fragrances,
                };

                return updated;
            });
        },
        []
    );

    // Set all fragrances for a box at once
    const setFragrances = useCallback(
        (boxIndex: number, fragrances: Fragrance[]) => {
            setBoxes((prev) => {
                const updated = [...prev];
                const box = updated[boxIndex];
                if (!box) return prev;

                updated[boxIndex] = {
                    ...box,
                    fragrances,
                };

                return updated;
            });
        },
        []
    );

    // Clear a deleted fragrance from all boxes
    const clearFragranceFromAll = useCallback((fragranceId: string) => {
        setBoxes((prev) =>
            prev.map((box) => ({
                ...box,
                fragrances: box.fragrances.filter((f) => f.id !== fragranceId),
            }))
        );
    }, []);

    // Derived: all boxes are complete (exactly 3 fragrances each)
    const allComplete = useMemo(() => {
        return boxes.every((box) => box.fragrances.length === 3);
    }, [boxes]);

    return {
        boxes,
        addBox,
        removeBox,
        updateBox,
        setSlot,
        setFragrances,
        clearFragranceFromAll,
        allComplete,
    };
}
