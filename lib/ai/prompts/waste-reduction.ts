import type { WasteReductionInput } from '@/lib/ai/types';
import { formatDietaryPreferencesForPrompt, formatIngredientsForPrompt } from './system';

export function buildWasteReductionPrompt(input: WasteReductionInput): string {
  return `現在の在庫食材(賞味期限つき):
${formatIngredientsForPrompt(input.ingredients)}

${formatDietaryPreferencesForPrompt(input.dietaryPreferences)}

賞味期限が最も近い食材を1つ選び、それを無駄にしないための料理を1件提案してください。
highlightedIngredientNameにはその食材名を、
messageには「(食材名)が(いつ)期限なので(料理名)がおすすめです」のような
ユーザーへの一言メッセージを日本語で入れてください。`;
}
