/**
 * useBoxes
 * Manages the list of gift boxes (pure client-side state)
 */

import { useState, useCallback, useMemo } from 'react';
import type { Fragrance } from '../api/fragrances';

export interface Box {
  fragrances: [Fragrance | null, Fragrance | null, Fragrance | null];
  inscription: string;
}

export interface UseBoxesResult {
  boxes: Box[];
  addBox: () => void;
  removeBox: (index: number) => void;
  updateBox: (index: number, box: Box) => void;
  setSlot: (boxIndex: number, slotIndex: number, fragrance: Fragrance | null) => void;
  clearFragranceFromAll: (fragranceId: string) => void;
  allComplete: boolean;
}

/**
 * Create an empty box with 3 null slots and empty inscription
 */
function createEmptyBox(): Box {
  return {
    fragrances: [null, null, null],
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

  // Set a fragrance in a specific slot
  const setSlot = useCallback(
    (boxIndex: number, slotIndex: number, fragrance: Fragrance | null) => {
      setBoxes((prev) => {
        const updated = [...prev];
        const box = updated[boxIndex];
        if (!box) return prev;

        const newFragrances: [Fragrance | null, Fragrance | null, Fragrance | null] = [
          ...box.fragrances,
        ] as [Fragrance | null, Fragrance | null, Fragrance | null];
        newFragrances[slotIndex] = fragrance;

        updated[boxIndex] = {
          ...box,
          fragrances: newFragrances,
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
        fragrances: box.fragrances.map((f) =>
          f?.id === fragranceId ? null : f
        ) as [Fragrance | null, Fragrance | null, Fragrance | null],
      }))
    );
  }, []);

  // Derived: all boxes are complete (3 non-null fragrances each)
  const allComplete = useMemo(() => {
    return boxes.every((box) => box.fragrances.every((f) => f !== null));
  }, [boxes]);

  return {
    boxes,
    addBox,
    removeBox,
    updateBox,
    setSlot,
    clearFragranceFromAll,
    allComplete,
  };
}
