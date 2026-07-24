import type { RecipeSuggestion } from '@/lib/ai/types';
import type { CurrentSeason } from '@/lib/date';
import type { LocalRecipe } from '@/lib/recipes/types';

export interface InventoryItem {
  name: string;
  expiringSoon: boolean;
}

function isInSeason(recipe: LocalRecipe, season: CurrentSeason | undefined): boolean {
  if (!season) return true;
  return recipe.seasons.includes('all') || recipe.seasons.includes(season);
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

export function normalizeIngredientName(name: string): string {
  let n = name.replace(/\s+/g, '').toLowerCase();
  for (const token of CUT_TOKENS) {
    n = n.split(token).join('');
  }
  return n;
}

const normalize = normalizeIngredientName;

/** 2つの食材名が同一とみなせるか(部分一致・双方向・部位表記ゆれ吸収)。 */
export function namesMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na.length === 0 || nb.length === 0) return false;
  return na.includes(nb) || nb.includes(na);
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
  currentSeason?: CurrentSeason,
  limit = 12,
): RecipeSuggestion[] {
  const makeable = recipes
    .map((r) => evaluate(r, inventory))
    .filter((e) => e.missing.length === 0);

  makeable.sort((a, b) => {
    // 1. 賞味期限が近い食材を使うレシピを最優先
    if (a.usesExpiring !== b.usesExpiring) return a.usesExpiring ? -1 : 1;
    // 2. 旬のレシピを優先
    const aSeason = isInSeason(a.recipe, currentSeason);
    const bSeason = isInSeason(b.recipe, currentSeason);
    if (aSeason !== bSeason) return aSeason ? -1 : 1;
    // 3. 調理時間が短い順
    return a.recipe.cookingTimeMinutes - b.recipe.cookingTimeMinutes;
  });

  return makeable.slice(0, limit).map((e) => e.suggestion);
}

/**
 * 現在の季節が旬のレシピを返す('all'通年は含めない、その季節ならではのものを提示)。
 * 在庫で作れるものを優先しつつ、不足が少ない順に並べる。
 */
export function findSeasonalRecipes(
  recipes: LocalRecipe[],
  inventory: InventoryItem[],
  currentSeason: CurrentSeason,
  limit = 12,
): { missingCount: number; recipe: RecipeSuggestion }[] {
  const seasonal = recipes
    .filter((r) => r.seasons.includes(currentSeason))
    .map((r) => evaluate(r, inventory));

  seasonal.sort((a, b) => {
    if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
    return a.recipe.cookingTimeMinutes - b.recipe.cookingTimeMinutes;
  });

  return seasonal.slice(0, limit).map((e) => ({
    missingCount: e.missing.length,
    recipe: e.suggestion,
  }));
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
