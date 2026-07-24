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

// 常備調味料かどうかは辞書の staple フラグだけで判定する。
// 名前のキーワード一致に頼ると「油揚げ」を油と誤認するなど、誤ヒットの原因になるため使わない。
function isStaple(_ingredientName: string, stapleFlag: boolean): boolean {
  return stapleFlag;
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
      // 常備調味料は「持っている前提」。在庫照合はせず、staple:true で見た目を区別できるようにする。
      return { name: ing.name, quantity: ing.quantity, owned: true, staple: true };
    }
    const matched = matchesInventory(ing.name, inventory);
    if (matched) {
      if (matched.expiringSoon) usesExpiring = true;
      return { name: ing.name, quantity: ing.quantity, owned: true, staple: false };
    }
    missing.push(ing.name);
    return { name: ing.name, quantity: ing.quantity, owned: false, staple: false };
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

export interface BrowseFilters {
  query?: string;
  tag?: string; // タグ(和食/中華/主菜 など)で絞り込み
  limit?: number;
}

export interface BrowseResult {
  missingCount: number;
  recipe: RecipeSuggestion;
}

/**
 * 登録されている全レシピを一覧・検索する。在庫との照合で「作れる/あと何品」も分かる。
 * 在庫で作れるもの→不足が少ない順、次に調理時間が短い順で並べる。
 */
export function browseRecipes(
  recipes: LocalRecipe[],
  inventory: InventoryItem[],
  filters: BrowseFilters = {},
): BrowseResult[] {
  const q = filters.query?.trim().toLowerCase();

  let filtered = recipes;
  if (q) {
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q)),
    );
  }
  if (filters.tag) {
    filtered = filtered.filter((r) => r.tags.includes(filters.tag!));
  }

  const evaluated = filtered.map((r) => evaluate(r, inventory));
  evaluated.sort((a, b) => {
    if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
    return a.recipe.cookingTimeMinutes - b.recipe.cookingTimeMinutes;
  });

  return evaluated
    .slice(0, filters.limit ?? 200)
    .map((e) => ({ missingCount: e.missing.length, recipe: e.suggestion }));
}

/** 辞書に含まれるタグの一覧(カテゴリ絞り込み用)。 */
export function collectTags(recipes: LocalRecipe[]): string[] {
  const counts = new Map<string, number>();
  for (const r of recipes) {
    for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
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
