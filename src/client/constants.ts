/**
 * Fragrance categories
 * Used in fragrance form dropdown and category labels
 */
export const CATEGORIES = [
  "Fresh",
  "Herbaceous",
  "Woody",
  "Smokey",
  "Floral",
  "Citrus",
  "Fruity",
] as const;

export type Category = (typeof CATEGORIES)[number];
