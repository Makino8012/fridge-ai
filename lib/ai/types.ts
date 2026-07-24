import { z } from 'zod';

export const ingredientInputSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  expiryDate: z.string().nullable(),
});
export type IngredientInput = z.infer<typeof ingredientInputSchema>;

export const dietaryPreferencesInputSchema = z.object({
  allergies: z.array(z.string()),
  dislikes: z.array(z.string()),
  diet: z.enum(['high_protein', 'low_fat']).nullable(),
});
export type DietaryPreferencesInput = z.infer<typeof dietaryPreferencesInputSchema>;

export const recipeSuggestionSchema = z.object({
  title: z.string(),
  difficulty: z.enum(['easy', 'normal', 'hard']),
  cookingTimeMinutes: z.number(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.string(),
      owned: z.boolean(),
    }),
  ),
  steps: z.array(z.string()),
  usesExpiringIngredient: z.boolean(),
});
export type RecipeSuggestion = z.infer<typeof recipeSuggestionSchema>;

// ① 今ある食材から作れる料理
export const suggestRecipesInputSchema = z.object({
  ingredients: z.array(ingredientInputSchema),
  dietaryPreferences: dietaryPreferencesInputSchema,
});
export type SuggestRecipesInput = z.infer<typeof suggestRecipesInputSchema>;

export const suggestRecipesOutputSchema = z.object({
  recipes: z.array(recipeSuggestionSchema).length(5),
});
export type SuggestRecipesOutput = z.infer<typeof suggestRecipesOutputSchema>;

// ② あと何を買えば作れる料理
export const missingIngredientsInputSchema = z.object({
  ingredients: z.array(ingredientInputSchema),
  missingIngredientName: z.string(),
  dietaryPreferences: dietaryPreferencesInputSchema,
});
export type MissingIngredientsInput = z.infer<typeof missingIngredientsInputSchema>;

export const missingIngredientsOutputSchema = z.object({
  recipes: z.array(recipeSuggestionSchema),
});
export type MissingIngredientsOutput = z.infer<typeof missingIngredientsOutputSchema>;

// ③ 献立提案
export const menuPlanTimeframeSchema = z.enum(['today_dinner', 'tomorrow_breakfast', 'this_week']);
export type MenuPlanTimeframe = z.infer<typeof menuPlanTimeframeSchema>;

export const menuPlanInputSchema = z.object({
  ingredients: z.array(ingredientInputSchema),
  dietaryPreferences: dietaryPreferencesInputSchema,
  timeframe: menuPlanTimeframeSchema,
});
export type MenuPlanInput = z.infer<typeof menuPlanInputSchema>;

export const menuPlanOutputSchema = z.object({
  plans: z.array(
    z.object({
      mealLabel: z.string(),
      recipe: recipeSuggestionSchema,
    }),
  ),
});
export type MenuPlanOutput = z.infer<typeof menuPlanOutputSchema>;

// ④ 食材を無駄なく使う提案(賞味期限優先)
export const wasteReductionInputSchema = z.object({
  ingredients: z.array(ingredientInputSchema),
  dietaryPreferences: dietaryPreferencesInputSchema,
});
export type WasteReductionInput = z.infer<typeof wasteReductionInputSchema>;

export const wasteReductionOutputSchema = z.object({
  highlightedIngredientName: z.string(),
  message: z.string(),
  recipe: recipeSuggestionSchema,
});
export type WasteReductionOutput = z.infer<typeof wasteReductionOutputSchema>;

// ⑤ 買い物リスト作成(不足食材抽出)
export const shoppingListInputSchema = z.object({
  ingredients: z.array(ingredientInputSchema),
  desiredRecipeTitles: z.array(z.string()).optional(),
});
export type ShoppingListInput = z.infer<typeof shoppingListInputSchema>;

export const shoppingListOutputSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.string(),
      unit: z.string(),
      reason: z.string(),
    }),
  ),
});
export type ShoppingListOutput = z.infer<typeof shoppingListOutputSchema>;

// レシートOCR: 写真から食材品目を抽出
export const receiptCategorySchema = z.enum([
  'vegetable',
  'meat',
  'fish',
  'drink',
  'frozen',
  'seasoning',
  'other',
]);

export const receiptItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  categoryId: receiptCategorySchema,
});
export type ReceiptItem = z.infer<typeof receiptItemSchema>;

export const receiptExtractInputSchema = z.object({
  imageBase64: z.string(),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});
export type ReceiptExtractInput = z.infer<typeof receiptExtractInputSchema>;

export const receiptExtractOutputSchema = z.object({
  items: z.array(receiptItemSchema),
});
export type ReceiptExtractOutput = z.infer<typeof receiptExtractOutputSchema>;

/**
 * AIプロバイダの共通インターフェース。
 * lib/ai/providers/* が実装し、services/* からはこのインターフェースのみを参照する。
 * Claude以外(OpenAI/Gemini)へ切り替える場合は、この型を満たす実装を追加し
 * provider.ts のファクトリを変更するだけでよい。
 */
export interface AiProvider {
  suggestRecipes(input: SuggestRecipesInput): Promise<SuggestRecipesOutput>;
  suggestWithMissingIngredient(input: MissingIngredientsInput): Promise<MissingIngredientsOutput>;
  suggestMenuPlan(input: MenuPlanInput): Promise<MenuPlanOutput>;
  suggestWasteReduction(input: WasteReductionInput): Promise<WasteReductionOutput>;
  suggestShoppingList(input: ShoppingListInput): Promise<ShoppingListOutput>;
  extractReceiptItems(input: ReceiptExtractInput): Promise<ReceiptExtractOutput>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
    // ユーザーにそのまま表示してよい日本語メッセージ(課金不足など原因が明確なとき)。
    public readonly userMessage?: string,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

/** unknown なエラーからユーザー向けの日本語メッセージを取り出す。 */
export function aiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AiProviderError && error.userMessage) return error.userMessage;
  return fallback;
}
