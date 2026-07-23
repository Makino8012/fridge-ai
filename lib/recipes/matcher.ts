import type { RecipeSuggestion } from '@/lib/ai/types';
import type { LocalRecipe } from '@/lib/recipes/types';

export interface InventoryItem {
  name: string;
  expiringSoon: boolean;
}

// 常備調味料として扱うキーワード。辞書のstapleフラグに加え、名前でも判定して取りこぼしを防ぐ。
const STAPLE_KEYWORDS = [
  '塩',
  'こしょう',
  '胡椒',
  '醤油',
  'しょうゆ',
  '味噌',
  'みそ',
  '砂糖',
  '酒',
  'みりん',
  '油',
  'サラダ油',
  'ごま油',
  'オリーブ',
  'だし',
  'かつお節',
  '片栗粉',
  '小麦粉',
  'パン粉',
  'ケチャップ',
  'マヨネーズ',
  'ソース',
  'オイスターソース',
  'ポン酢',
  'バター',
  'コンソメ',
  'にんにく',
  '生姜',
  'しょうが',
];

// 肉・魚の部位や切り方の表記を吸収し、「豚こま肉」と「豚肉」を同一視できるようにする。
const CUT_TOKENS = ['こま', '細切れ', '切れ', 'スライス', '薄切り', 'バラ', 'もも', 'むね', 'ロース', 'ひき', '挽き', '挽'];

function normalize(name: string): string {
  let n = name.replace(/\s+/g, '').toLowerCase();
  for (const token of CUT_TOKENS) {
    n = n.split(token).join('');
  }
  return n;
}

function isStaple(ingredientName: string, stapleFlag: boolean): boolean {
  if (stapleFlag) return true;
  const n = normalize(ingredientName);
  return STAPLE_KEYWORDS.some((kw) => n.includes(normalize(kw)));
}

// 在庫食材名とレシピ材料名を緩く突き合わせる(部分一致・双方向)。
function matchesInventory(ingredientName: string, inventory: InventoryItem[]): InventoryItem | null {
  const target = normalize(ingredientName);
  for (const item of inventory) {
    const inv = normalize(item.name);
    if (inv.length === 0) continue;
    if (inv.includes(target) || target.includes(inv)) return item;
  }
  return null;
}

interface EvaluatedRecipe {
  recipe: LocalRecipe;
  missing: string[]; // 不足している非常備材料の名前
  usesExpiring: boolean;
  suggestion: RecipeSuggestion;
}

function evaluate(recipe: LocalRecipe, inventory: InventoryItem[]): EvaluatedRecipe {
  const missing: string[] = [];
  let usesExpiring = false;

  const suggestionIngredients = recipe.ingredients.map((ing) => {
    const staple = isStaple(ing.name, ing.staple);
    if (staple) {
      return { name: ing.name, quantity: ing.quantity, owned: true };
    }
    const matched = matchesInventory(ing.name, inventory);
    if (matched) {
      if (matched.expiringSoon) usesExpiring = true;
      return { name: ing.name, quantity: ing.quantity, owned: true };
    }
    missing.push(ing.name);
    return { name: ing.name, quantity: ing.quantity, owned: false };
  });

  return {
    recipe,
    missing,
    usesExpiring,
    suggestion: {
      title: recipe.title,
      difficulty: recipe.difficulty,
      cookingTimeMinutes: recipe.cookingTimeMinutes,
      ingredients: suggestionIngredients,
      steps: recipe.steps,
      usesExpiringIngredient: usesExpiring,
    },
  };
}

/**
 * 在庫(+常備調味料)だけで作れるレシピを返す。
 * 期限が近い食材を使うレシピを優先して並べる。
 */
export function findMakeableRecipes(
  recipes: LocalRecipe[],
  inventory: InventoryItem[],
  limit = 10,
): RecipeSuggestion[] {
  const makeable = recipes
    .map((r) => evaluate(r, inventory))
    .filter((e) => e.missing.length === 0);

  makeable.sort((a, b) => {
    if (a.usesExpiring !== b.usesExpiring) return a.usesExpiring ? -1 : 1;
    return a.recipe.cookingTimeMinutes - b.recipe.cookingTimeMinutes;
  });

  return makeable.slice(0, limit).map((e) => e.suggestion);
}

/**
 * 非常備材料の不足があと1つだけのレシピを返す。
 * missingIngredientName を指定した場合は、その食材を買えば作れるものに絞る。
 */
export function findAlmostMakeableRecipes(
  recipes: LocalRecipe[],
  inventory: InventoryItem[],
  missingIngredientName?: string,
  limit = 10,
): { missingIngredient: string; recipe: RecipeSuggestion }[] {
  const target = missingIngredientName ? normalize(missingIngredientName) : null;

  const almost = recipes
    .map((r) => evaluate(r, inventory))
    .filter((e) => e.missing.length === 1)
    .filter((e) => {
      if (!target) return true;
      const m = normalize(e.missing[0]!);
      return m.includes(target) || target.includes(m);
    });

  almost.sort((a, b) => a.recipe.cookingTimeMinutes - b.recipe.cookingTimeMinutes);

  return almost.slice(0, limit).map((e) => ({
    missingIngredient: e.missing[0]!,
    recipe: e.suggestion,
  }));
}
