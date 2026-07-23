export const BASE_SYSTEM_PROMPT = `あなたは家庭料理に詳しい日本の管理栄養士兼レシピアドバイザーです。
ユーザーは日本の家庭で自炊する2人暮らしのカップルです。
一般的な日本の家庭にある調味料(塩・こしょう・醤油・味噌・砂糖・酒・みりん・サラダ油など)は
在庫リストになくても「常備調味料」として自由に使ってよいものとします。
必ず日本語で、実際に家庭で作れる現実的な分量・手順で回答してください。
アレルギー食材・苦手な食材は絶対に提案に含めないでください。`;

export function formatIngredientsForPrompt(
  ingredients: { name: string; quantity: number; unit: string; expiryDate: string | null }[],
): string {
  if (ingredients.length === 0) return '(在庫なし)';
  return ingredients
    .map((i) => `- ${i.name} ${i.quantity}${i.unit}${i.expiryDate ? ` (賞味期限: ${i.expiryDate})` : ''}`)
    .join('\n');
}

export function formatDietaryPreferencesForPrompt(prefs: {
  allergies: string[];
  dislikes: string[];
  diet: string | null;
}): string {
  const lines: string[] = [];
  lines.push(`アレルギー食材: ${prefs.allergies.length > 0 ? prefs.allergies.join('、') : 'なし'}`);
  lines.push(`苦手な食材: ${prefs.dislikes.length > 0 ? prefs.dislikes.join('、') : 'なし'}`);
  if (prefs.diet === 'high_protein') lines.push('方針: 高タンパクなレシピを優先してください');
  if (prefs.diet === 'low_fat') lines.push('方針: 低脂質なレシピを優先してください');
  return lines.join('\n');
}
