/**
 * Unit tests for useBoxes hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoxes } from '../../../src/client/hooks/useBoxes';
import type { Fragrance } from '../../../src/client/api/fragrances';

describe('useBoxes', () => {
  const mockFragrance1: Fragrance = {
    id: '1',
    name: 'Lavender',
    description: 'Calming',
    category: 'Floral',
    image_url: 'https://example.com/1.jpg',
    recipe: 'Recipe 1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockFragrance2: Fragrance = {
    id: '2',
    name: 'Ocean',
    description: 'Fresh',
    category: 'Fresh',
    image_url: 'https://example.com/2.jpg',
    recipe: 'Recipe 2',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockFragrance3: Fragrance = {
    id: '3',
    name: 'Pine',
    description: 'Woody',
    category: 'Woody',
    image_url: 'https://example.com/3.jpg',
    recipe: 'Recipe 3',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  it('should initialize with one empty box', () => {
    const { result } = renderHook(() => useBoxes());

    expect(result.current.boxes).toHaveLength(1);
    expect(result.current.boxes[0].fragrances).toEqual([null, null, null]);
    expect(result.current.boxes[0].inscription).toBe('');
    expect(result.current.allComplete).toBe(false);
  });

  it('should add a new box', () => {
    const { result } = renderHook(() => useBoxes());

    act(() => {
      result.current.addBox();
    });

    expect(result.current.boxes).toHaveLength(2);
    expect(result.current.boxes[1].fragrances).toEqual([null, null, null]);
  });

  it('should remove a box', () => {
    const { result } = renderHook(() => useBoxes());

    act(() => {
      result.current.addBox();
      result.current.addBox();
    });

    expect(result.current.boxes).toHaveLength(3);

    act(() => {
      result.current.removeBox(1);
    });

    expect(result.current.boxes).toHaveLength(2);
  });

  it('should set a fragrance in a slot', () => {
    const { result } = renderHook(() => useBoxes());

    act(() => {
      result.current.setSlot(0, 0, mockFragrance1);
    });

    expect(result.current.boxes[0].fragrances[0]).toEqual(mockFragrance1);
    expect(result.current.boxes[0].fragrances[1]).toBeNull();
    expect(result.current.boxes[0].fragrances[2]).toBeNull();
  });

  it('should clear a slot by setting it to null', () => {
    const { result } = renderHook(() => useBoxes());

    act(() => {
      result.current.setSlot(0, 0, mockFragrance1);
      result.current.setSlot(0, 0, null);
    });

    expect(result.current.boxes[0].fragrances[0]).toBeNull();
  });

  it('should track allComplete correctly', () => {
    const { result } = renderHook(() => useBoxes());

    expect(result.current.allComplete).toBe(false);

    act(() => {
      result.current.setSlot(0, 0, mockFragrance1);
    });

    expect(result.current.allComplete).toBe(false);

    act(() => {
      result.current.setSlot(0, 1, mockFragrance2);
    });

    expect(result.current.allComplete).toBe(false);

    act(() => {
      result.current.setSlot(0, 2, mockFragrance3);
    });

    expect(result.current.allComplete).toBe(true);
  });

  it('should track allComplete with multiple boxes', () => {
    const { result } = renderHook(() => useBoxes());

    act(() => {
      result.current.addBox();
      result.current.setSlot(0, 0, mockFragrance1);
      result.current.setSlot(0, 1, mockFragrance2);
      result.current.setSlot(0, 2, mockFragrance3);
    });

    expect(result.current.allComplete).toBe(false); // Second box is empty

    act(() => {
      result.current.setSlot(1, 0, mockFragrance1);
      result.current.setSlot(1, 1, mockFragrance2);
      result.current.setSlot(1, 2, mockFragrance3);
    });

    expect(result.current.allComplete).toBe(true);
  });

  it('should clear a fragrance from all boxes', () => {
    const { result } = renderHook(() => useBoxes());

    act(() => {
      result.current.addBox();
      result.current.setSlot(0, 0, mockFragrance1);
      result.current.setSlot(0, 1, mockFragrance2);
      result.current.setSlot(1, 0, mockFragrance1);
    });

    expect(result.current.boxes[0].fragrances[0]).toEqual(mockFragrance1);
    expect(result.current.boxes[1].fragrances[0]).toEqual(mockFragrance1);

    act(() => {
      result.current.clearFragranceFromAll('1');
    });

    expect(result.current.boxes[0].fragrances[0]).toBeNull();
    expect(result.current.boxes[0].fragrances[1]).toEqual(mockFragrance2); // Others unchanged
    expect(result.current.boxes[1].fragrances[0]).toBeNull();
  });

  it('should update a box entirely', () => {
    const { result } = renderHook(() => useBoxes());

    const newBox = {
      fragrances: [mockFragrance1, mockFragrance2, mockFragrance3] as [Fragrance, Fragrance, Fragrance],
      inscription: 'Test inscription',
    };

    act(() => {
      result.current.updateBox(0, newBox);
    });

    expect(result.current.boxes[0]).toEqual(newBox);
    expect(result.current.allComplete).toBe(true);
  });
});
