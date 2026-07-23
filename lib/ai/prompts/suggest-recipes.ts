import type { SuggestRecipesInput } from '@/lib/ai/types';
import { formatDietaryPreferencesForPrompt, formatIngredientsForPrompt } from './system';

export function buildSuggestRecipesPrompt(input: SuggestRecipesInput): string {
  return `現在の在庫食材:
${formatIngredientsForPrompt(input.ingredients)}

${formatDietaryPreferencesForPrompt(input.dietaryPreferences)}

上記の在庫(と常備調味料)だけで作れる料理を、難易度・調理時間・食材の使い切りやすさのバランスを考えて
ちょうど5件提案してください。賞味期限が近い食材があれば、それを使うレシピを優先し
usesExpiringIngredientをtrueにしてください。`;
}
