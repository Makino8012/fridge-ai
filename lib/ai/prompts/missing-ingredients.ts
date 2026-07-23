import type { MissingIngredientsInput } from '@/lib/ai/types';
import { formatDietaryPreferencesForPrompt, formatIngredientsForPrompt } from './system';

export function buildMissingIngredientsPrompt(input: MissingIngredientsInput): string {
  return `現在の在庫食材:
${formatIngredientsForPrompt(input.ingredients)}

${formatDietaryPreferencesForPrompt(input.dietaryPreferences)}

もし「${input.missingIngredientName}」を追加で買い足した場合に、
現在の在庫 + 「${input.missingIngredientName}」だけで新たに作れるようになる料理を2〜4件提案してください。
各レシピのingredientsには、既に持っている食材はowned: true、
「${input.missingIngredientName}」はowned: falseとして含めてください。`;
}
