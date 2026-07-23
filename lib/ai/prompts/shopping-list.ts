import type { ShoppingListInput } from '@/lib/ai/types';
import { formatIngredientsForPrompt } from './system';

export function buildShoppingListPrompt(input: ShoppingListInput): string {
  return `現在の在庫食材:
${formatIngredientsForPrompt(input.ingredients)}
${
  input.desiredRecipeTitles && input.desiredRecipeTitles.length > 0
    ? `\n作りたい料理: ${input.desiredRecipeTitles.join('、')}\nこれらの料理を作るために不足している食材だけを抽出してください。`
    : '\n在庫が少ない、または一般的な家庭で切らしがちな食材で、補充した方がよいものを提案してください。'
}
在庫に既にあるものは含めないでください。`;
}
