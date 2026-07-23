import { describe, expect, it } from 'vitest';
import { ingredientFormSchema } from './schema';

const validInput = {
  name: '卵',
  quantity: 10,
  unit: '個',
  categoryId: 'other' as const,
  storageLocationId: 'fridge' as const,
  expiryDate: '2026-08-01',
  memo: null,
};

describe('ingredientFormSchema', () => {
  it('accepts valid input', () => {
    expect(ingredientFormSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = ingredientFormSchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative quantity', () => {
    const result = ingredientFormSchema.safeParse({ ...validInput, quantity: -1 });
    expect(result.success).toBe(false);
  });

  it('coerces numeric strings for quantity (form inputs arrive as strings)', () => {
    const result = ingredientFormSchema.safeParse({ ...validInput, quantity: '5' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.quantity).toBe(5);
  });

  it('rejects an unknown category', () => {
    const result = ingredientFormSchema.safeParse({ ...validInput, categoryId: 'unknown' });
    expect(result.success).toBe(false);
  });
});
