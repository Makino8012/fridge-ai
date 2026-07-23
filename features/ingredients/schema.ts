import { z } from 'zod';

const categoryIdSchema = z.enum(['vegetable', 'meat', 'fish', 'drink', 'frozen', 'seasoning', 'other']);
const storageLocationIdSchema = z.enum(['fridge', 'freezer', 'room_temp']);

export const ingredientFormSchema = z.object({
  name: z.string().min(1, '食材名を入力してください').max(50),
  quantity: z.coerce.number().min(0, '0以上で入力してください'),
  unit: z.string().min(1, '単位を入力してください').max(10),
  categoryId: categoryIdSchema,
  storageLocationId: storageLocationIdSchema,
  expiryDate: z.string().nullable().default(null),
  memo: z.string().max(200).nullable().default(null),
});
export type IngredientFormInput = z.infer<typeof ingredientFormSchema>;

export const createIngredientSchema = ingredientFormSchema;

export const updateIngredientSchema = ingredientFormSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateIngredientFormInput = z.infer<typeof updateIngredientSchema>;

export const adjustQuantitySchema = z.object({
  id: z.string().uuid(),
  delta: z.number(),
  reason: z.enum(['used_in_recipe', 'purchased', 'expired_disposed', 'manual_adjust']),
});
export type AdjustQuantityInput = z.infer<typeof adjustQuantitySchema>;
