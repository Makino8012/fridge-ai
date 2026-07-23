import { z } from 'zod';

export const addShoppingItemSchema = z.object({
  name: z.string().min(1, '品目を入力してください').max(50),
  quantity: z.number().nullable().default(null),
  unit: z.string().nullable().default(null),
});
export type AddShoppingItemInput = z.infer<typeof addShoppingItemSchema>;
