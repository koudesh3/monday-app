/**
 * Validation — Single Source of Truth
 *
 * Pure field-level validator functions used by both:
 * - Inline (blur) validation in components
 * - Pre-submission validation in App
 *
 * All validators return null (valid) or string (error message).
 */

export interface Fragrance {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
}

export interface Box {
  fragrances: (Fragrance | null)[];
  inscription: string;
}

export interface OrderPayload {
  firstName: string;
  lastName: string;
  boxes: Box[];
}

export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  boxes?: string;
  boxErrors?: (BoxErrors | null)[];
}

export interface BoxErrors {
  slots?: string;
  inscription?: string;
}

/**
 * Field-level validation rules.
 * Each returns null (valid) or error message string.
 */
export const rules = {
  firstName: (value: string): string | null => {
    if (!value.trim()) return "Required";
    if (value.length > 100) return "Max 100 characters";
    return null;
  },

  lastName: (value: string): string | null => {
    if (!value.trim()) return "Required";
    if (value.length > 100) return "Max 100 characters";
    return null;
  },

  inscription: (value: string): string | null => {
    if (value.length > 200) return "Max 200 characters";
    return null;
  },

  fragName: (value: string): string | null => {
    if (!value.trim()) return "Required";
    if (value.length > 100) return "Max 100 characters";
    return null;
  },

  fragDesc: (value: string): string | null => {
    if (value.length > 300) return "Max 300 characters";
    return null;
  },

  imageUrl: (value: string): string | null => {
    if (!value.trim()) return "Required";
    try {
      new URL(value);
      return null;
    } catch {
      return "Invalid URL";
    }
  },
};

/**
 * Form-level validation for order submission.
 * Validates firstName, lastName, and all boxes.
 *
 * Returns null if valid, or ValidationErrors object.
 */
export function validateOrder(payload: OrderPayload): ValidationErrors | null {
  const errors: ValidationErrors = {};

  // Validate first name
  const fnErr = rules.firstName(payload.firstName);
  if (fnErr) errors.firstName = fnErr;

  // Validate last name
  const lnErr = rules.lastName(payload.lastName);
  if (lnErr) errors.lastName = lnErr;

  // Validate at least one box exists
  if (payload.boxes.length === 0) {
    errors.boxes = "At least one box required";
  }

  // Validate each box
  const boxErrors = payload.boxes.map((box): BoxErrors | null => {
    const be: BoxErrors = {};

    // Check all 3 fragrances are filled
    const filled = box.fragrances.filter(Boolean);
    if (filled.length < 3) {
      be.slots = "All 3 fragrances required";
    }

    // Validate inscription
    const insErr = rules.inscription(box.inscription);
    if (insErr) {
      be.inscription = insErr;
    }

    return Object.keys(be).length > 0 ? be : null;
  });

  if (boxErrors.some(Boolean)) {
    errors.boxErrors = boxErrors;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Form-level validation for fragrance add/edit form.
 * Validates all required fields.
 *
 * Returns an object with field names as keys and error messages (or null) as values.
 */
export function validateFragranceForm(form: {
  name: string;
  description: string;
  image_url: string;
  category: string;
  recipe: string;
}): Record<string, string | null> {
  return {
    name: rules.fragName(form.name),
    description: rules.fragDesc(form.description),
    image_url: rules.imageUrl(form.image_url),
    category: !form.category.trim() ? "Required" : null,
    recipe: !form.recipe.trim() ? "Required" : null,
  };
}
