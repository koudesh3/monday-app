/**
 * Unit tests for validation functions
 */

import { describe, it, expect } from 'vitest';
import { rules, validateOrder } from '../src/client/validation';
import type { OrderPayload } from '../src/client/validation';

describe('validation rules', () => {
  describe('firstName', () => {
    it('should pass for valid first names', () => {
      expect(rules.firstName('John')).toBeNull();
      expect(rules.firstName('Mary Jane')).toBeNull();
    });

    it('should fail for empty strings', () => {
      expect(rules.firstName('')).toBe('Required');
      expect(rules.firstName('   ')).toBe('Required');
    });

    it('should fail for strings over 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(rules.firstName(longName)).toBe('Max 100 characters');
    });

    it('should pass for exactly 100 characters', () => {
      const maxName = 'a'.repeat(100);
      expect(rules.firstName(maxName)).toBeNull();
    });
  });

  describe('lastName', () => {
    it('should pass for valid last names', () => {
      expect(rules.lastName('Smith')).toBeNull();
      expect(rules.lastName('Van Der Berg')).toBeNull();
    });

    it('should fail for empty strings', () => {
      expect(rules.lastName('')).toBe('Required');
      expect(rules.lastName('   ')).toBe('Required');
    });

    it('should fail for strings over 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(rules.lastName(longName)).toBe('Max 100 characters');
    });
  });

  describe('inscription', () => {
    it('should pass for empty strings (optional field)', () => {
      expect(rules.inscription('')).toBeNull();
    });

    it('should pass for valid inscriptions', () => {
      expect(rules.inscription('Happy Birthday!')).toBeNull();
      expect(rules.inscription('With love from Mom')).toBeNull();
    });

    it('should fail for strings over 200 characters', () => {
      const longText = 'a'.repeat(201);
      expect(rules.inscription(longText)).toBe('Max 200 characters');
    });

    it('should pass for exactly 200 characters', () => {
      const maxText = 'a'.repeat(200);
      expect(rules.inscription(maxText)).toBeNull();
    });
  });

  describe('fragName', () => {
    it('should pass for valid fragrance names', () => {
      expect(rules.fragName('Lavender Dream')).toBeNull();
    });

    it('should fail for empty strings', () => {
      expect(rules.fragName('')).toBe('Required');
      expect(rules.fragName('   ')).toBe('Required');
    });

    it('should fail for strings over 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(rules.fragName(longName)).toBe('Max 100 characters');
    });
  });

  describe('fragDesc', () => {
    it('should pass for empty strings (optional field)', () => {
      expect(rules.fragDesc('')).toBeNull();
    });

    it('should pass for valid descriptions', () => {
      expect(rules.fragDesc('A calming lavender scent')).toBeNull();
    });

    it('should fail for strings over 300 characters', () => {
      const longDesc = 'a'.repeat(301);
      expect(rules.fragDesc(longDesc)).toBe('Max 300 characters');
    });

    it('should pass for exactly 300 characters', () => {
      const maxDesc = 'a'.repeat(300);
      expect(rules.fragDesc(maxDesc)).toBeNull();
    });
  });
});

describe('validateOrder', () => {
  const mockFragrance = {
    id: '1',
    name: 'Test',
    description: 'Test',
    category: 'Fresh',
    image_url: 'https://example.com/image.jpg',
    recipe: 'Test',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  it('should pass for valid order', () => {
    const payload: OrderPayload = {
      firstName: 'John',
      lastName: 'Smith',
      boxes: [
        {
          fragrances: [mockFragrance, mockFragrance, mockFragrance],
          inscription: 'Happy Birthday',
        },
      ],
    };

    expect(validateOrder(payload)).toBeNull();
  });

  it('should fail for missing first name', () => {
    const payload: OrderPayload = {
      firstName: '',
      lastName: 'Smith',
      boxes: [
        {
          fragrances: [mockFragrance, mockFragrance, mockFragrance],
          inscription: '',
        },
      ],
    };

    const errors = validateOrder(payload);
    expect(errors).not.toBeNull();
    expect(errors?.firstName).toBe('Required');
  });

  it('should fail for missing last name', () => {
    const payload: OrderPayload = {
      firstName: 'John',
      lastName: '   ',
      boxes: [
        {
          fragrances: [mockFragrance, mockFragrance, mockFragrance],
          inscription: '',
        },
      ],
    };

    const errors = validateOrder(payload);
    expect(errors).not.toBeNull();
    expect(errors?.lastName).toBe('Required');
  });

  it('should fail for empty boxes array', () => {
    const payload: OrderPayload = {
      firstName: 'John',
      lastName: 'Smith',
      boxes: [],
    };

    const errors = validateOrder(payload);
    expect(errors).not.toBeNull();
    expect(errors?.boxes).toBe('At least one box required');
  });

  it('should fail for incomplete box (missing fragrances)', () => {
    const payload: OrderPayload = {
      firstName: 'John',
      lastName: 'Smith',
      boxes: [
        {
          fragrances: [mockFragrance, null, null],
          inscription: '',
        },
      ],
    };

    const errors = validateOrder(payload);
    expect(errors).not.toBeNull();
    expect(errors?.boxErrors?.[0]?.slots).toBe('All 3 fragrances required');
  });

  it('should fail for invalid inscription', () => {
    const payload: OrderPayload = {
      firstName: 'John',
      lastName: 'Smith',
      boxes: [
        {
          fragrances: [mockFragrance, mockFragrance, mockFragrance],
          inscription: 'a'.repeat(201), // Over 200 chars
        },
      ],
    };

    const errors = validateOrder(payload);
    expect(errors).not.toBeNull();
    expect(errors?.boxErrors?.[0]?.inscription).toBe('Max 200 characters');
  });

  it('should validate multiple boxes independently', () => {
    const payload: OrderPayload = {
      firstName: 'John',
      lastName: 'Smith',
      boxes: [
        {
          fragrances: [mockFragrance, mockFragrance, mockFragrance],
          inscription: '', // Valid
        },
        {
          fragrances: [mockFragrance, null, null],
          inscription: 'a'.repeat(201), // Invalid
        },
      ],
    };

    const errors = validateOrder(payload);
    expect(errors).not.toBeNull();
    expect(errors?.boxErrors?.[0]).toBeNull(); // First box is valid
    expect(errors?.boxErrors?.[1]?.slots).toBe('All 3 fragrances required');
    expect(errors?.boxErrors?.[1]?.inscription).toBe('Max 200 characters');
  });

  it('should pass for optional empty inscription', () => {
    const payload: OrderPayload = {
      firstName: 'John',
      lastName: 'Smith',
      boxes: [
        {
          fragrances: [mockFragrance, mockFragrance, mockFragrance],
          inscription: '',
        },
      ],
    };

    expect(validateOrder(payload)).toBeNull();
  });
});
