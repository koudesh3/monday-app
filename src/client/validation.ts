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

export interface OrderLine {
  id: string;
  fragrances: Fragrance[];
  inscription: string;
}

export interface OrderPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  boxes: OrderLine[];
}

export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  shippingAddress?: string;
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

  email: (value: string): string | null => {
    if (!value.trim()) return "Required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Invalid email";
    return null;
  },

  phone: (value: string): string | null => {
    if (!value.trim()) return "Required";
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
      return "Invalid phone number";
    }
    return null;
  },

  shippingAddress: (value: string): string | null => {
    if (!value.trim()) return "Required";
    if (value.length > 300) return "Max 300 characters";
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

  imageUrl: (value: string | undefined): string | null => {
    if (!value || !value.trim()) return null; // Optional field
    try {
      new URL(value);
      return null;
    } catch {
      return "Invalid URL";
    }
  },

  category: (value: string): string | null => {
    if (!value.trim()) return "Required";
    if (value.length > 50) return "Max 50 characters";
    return null;
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

  // Validate email
  const emailErr = rules.email(payload.email);
  if (emailErr) errors.email = emailErr;

  // Validate phone
  const phoneErr = rules.phone(payload.phone);
  if (phoneErr) errors.phone = phoneErr;

  // Validate shipping address
  const addressErr = rules.shippingAddress(payload.shippingAddress);
  if (addressErr) errors.shippingAddress = addressErr;

  // Validate at least one box exists
  if (payload.boxes.length === 0) {
    errors.boxes = "At least one box required";
  }

  // Validate each box
  const boxErrors = payload.boxes.map((line): BoxErrors | null => {
    const be: BoxErrors = {};

    // Check exactly 3 unique fragrances are selected
    if (line.fragrances.length < 3) {
      be.slots = "All 3 fragrances required";
    } else if (line.fragrances.length > 3) {
      be.slots = "Maximum 3 fragrances allowed";
    } else {
      // Check for duplicates
      const uniqueIds = new Set(line.fragrances.map((f) => f.id));
      if (uniqueIds.size !== 3) {
        be.slots = "All fragrances must be unique";
      }
    }

    // Validate inscription
    const insErr = rules.inscription(line.inscription);
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
  image_url?: string;
  category: string;
  recipe?: string;
}): Record<string, string | null> {
  return {
    name: rules.fragName(form.name),
    description: rules.fragDesc(form.description),
    image_url: rules.imageUrl(form.image_url),
    category: rules.category(form.category),
    recipe: null, // Optional field
  };
}
