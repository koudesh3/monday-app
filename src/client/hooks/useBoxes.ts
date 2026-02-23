/**
 * useBoxes
 * Manages the list of gift boxes (pure client-side state)
 */

import { useState, useCallback, useMemo } from 'react';
import type { Fragrance } from '../api/fragrances';

export interface Box {
  fragrances: Fragrance[];
  inscription: string;
}

export interface UseBoxesResult {
  boxes: Box[];
  addBox: () => void;
  removeBox: (index: number) => void;
  updateBox: (index: number, box: Box) => void;
  setSlot: (boxIndex: number, slotIndex: number, fragrance: Fragrance | null) => void;
  setFragrances: (boxIndex: number, fragrances: Fragrance[]) => void;
  clearFragranceFromAll: (fragranceId: string) => void;
  allComplete: boolean;
}

/**
 * Create an empty box with empty fragrances array and empty inscription
 */
function createEmptyBox(): Box {
  return {
    fragrances: [],
    inscription: '',
  };
}

/**
 * Manage gift boxes with slot selection and inscription
 * - Boxes aren't persisted until order submission
 * - Each box has 3 fragrance slots and an inscription
 * - allComplete is derived: every box has 3 non-null fragrances
 */
export function useBoxes(): UseBoxesResult {
  const [boxes, setBoxes] = useState<Box[]>([createEmptyBox()]);

  // Add a new empty box
  const addBox = useCallback(() => {
    setBoxes((prev) => [...prev, createEmptyBox()]);
  }, []);

  // Remove a box by index
  const removeBox = useCallback((index: number) => {
    setBoxes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Replace a box at index
  const updateBox = useCallback((index: number, box: Box) => {
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
