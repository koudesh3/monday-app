/**
 * CategoryDot
 * Small colored circle indicating fragrance category
 */

import React from 'react';

export interface CategoryDotProps {
  category: string;
}

/**
 * Displays a small colored dot for a fragrance category.
 * Color is derived from CSS variable naming convention.
 */
export function CategoryDot({ category }: CategoryDotProps) {
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-');

  return (
    <span
      className="category-dot"
      style={{ backgroundColor: `var(--cat-${normalizedCategory}-fg)` }}
      aria-label={`${category} category`}
    />
  );
}
