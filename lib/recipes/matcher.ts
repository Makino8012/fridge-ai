import type { RecipeSuggestion } from '@/lib/ai/types';
import type { CurrentSeason } from '@/lib/date';
import { isMainDish } from '@/lib/recipes/dish-role';
import { isBasicStaple } from '@/lib/recipes/staples';
import type { LocalRecipe } from '@/lib/recipes/types';
import { estimateProteinPerServing } from '@/lib/nutrition';

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

// 食材そのものは同じで、状態や大きさだけを表す言葉。取り除いて比べる。
// 例:「ミニトマト」→「トマト」、「刻みのり」→「のり」、「大根おろし」→「大根」
const MODIFIER_PREFIXES = [
  'ミニ', 'プチ', '新', '春', '生', '冷凍', '刻み', 'きざみ', 'おろし', 'すりおろし',
  '乾燥', 'ゆで', '茹で', '焼き', '蒸し', 'むき', 'ぶな', '有塩', '無塩', '薄口', '濃口', '溶き', '粉',
];
const MODIFIER_SUFFIXES = ['おろし', '水煮', '缶詰', '缶', 'パウダー', '肉'];

// 呼び方が違うだけで同じもの。
const ALIASES: Record<string, string> = {
  卵黄: '卵', 卵白: '卵', たまご: '卵', 玉子: '卵',
  ねぎ: '長ねぎ', 青ねぎ: '長ねぎ', 万能ねぎ: '長ねぎ', 小ねぎ: '長ねぎ',
  しょうゆ: '醤油', みそ: '味噌', にんにく: 'にんにく', しょうが: '生姜',
  じゃが芋: 'じゃがいも', 薩摩芋: 'さつまいも', 人参: 'にんじん', 玉葱: '玉ねぎ',
};

function stripAffixes(text: string): string {
  let n = text;
  for (const prefix of MODIFIER_PREFIXES) {
    if (n.startsWith(prefix) && n.length > prefix.length) n = n.slice(prefix.length);
  }
  for (const suffix of MODIFIER_SUFFIXES) {
    if (n.endsWith(suffix) && n.length > suffix.length) n = n.slice(0, -suffix.length);
  }
  return n;
}

export function normalizeIngredientName(name: string): string {
  let n = name.replace(/\s+/g, '').toLowerCase();
  for (const token of CUT_TOKENS) {
    n = n.split(token).join('');
  }
  n = stripAffixes(n);
  // 別名は最後にそろえる(「卵黄」→「卵」など)。
  return ALIASES[n] ?? n;
}

const normalize = normalizeIngredientName;

/**
 * 2つの食材名が同じ食材を指すか。
 *
 * 以前は部分一致で判定していたが、「ねぎ」が「玉ねぎ」に、「油」が「油揚げ」に
 * 一致してしまい、持っていない食材を持っている扱いにしていた。
 * 表記ゆれ(部位・大きさ・状態・別名)をそろえたうえで完全一致を求める。
 */
export function namesMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na.length === 0 || nb.length === 0) return false;
  return na === nb;
}

// 「持っている前提」にしてよいのは、辞書で常備扱いかつ基礎調味料のものだけ。
// 辞書の staple にはオイスターソースやナンプラー、生のにんにく・生姜まで
// 含まれていて、家に無いのに在庫ありとみなされてしまうため。
// 名前のキーワード一致に頼ると「油揚げ」を油と誤認するので、名前の一致は完全一致で見る。
function isStaple(ingredientName: string, stapleFlag: boolean): boolean {
  return stapleFlag && isBasicStaple(ingredientName);
}

// 在庫にその材料があるかを探す。表記ゆれをそろえた完全一致で判定する。
function matchesInventory(ingredientName: string, inventory: InventoryItem[]): InventoryItem | null {
  return inventory.find((item) => namesMatch(item.name, ingredientName)) ?? null;
}

// タンパク質量は材料から毎回計算せず、一度だけ求めて使い回す。
const proteinCache = new Map<string, number>();

function proteinOf(recipe: LocalRecipe): number {
  // 提供元の数値があればそれを使う(自動推定より正確)。
  if (recipe.proteinPerServing !== undefined) return recipe.proteinPerServing;
  const cached = proteinCache.get(recipe.title);
  if (cached !== undefined) return cached;
  const value = estimateProteinPerServing(recipe.ingredients);
  proteinCache.set(recipe.title, value);
  return value;
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
      proteinPerServing: proteinOf(recipe),
    },
  };
}

/** 1レシピを在庫と照合した結果を返す(献立作成などから使う)。 */
export function evaluateRecipe(
  recipe: LocalRecipe,
  inventory: InventoryItem[],
): { missing: string[]; suggestion: RecipeSuggestion } {
  const result = evaluate(recipe, inventory);
  return { missing: result.missing, suggestion: result.suggestion };
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
    // 1. 単体で一食になる料理を先に。「今夜これどう?」に煮卵が出ると使い物にならない
    const aMain = isMainDish(a.recipe);
    const bMain = isMainDish(b.recipe);
    if (aMain !== bMain) return aMain ? -1 : 1;
    // 2. 賞味期限が近い食材を使うレシピを優先
    if (a.usesExpiring !== b.usesExpiring) return a.usesExpiring ? -1 : 1;
    // 3. 旬のレシピを優先
    const aSeason = isInSeason(a.recipe, currentSeason);
    const bSeason = isInSeason(b.recipe, currentSeason);
    if (aSeason !== bSeason) return aSeason ? -1 : 1;
    // 4. 調理時間が短い順
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

export interface UseUpResult {
  /** 指定した食材のうち、このレシピで使えるもの。 */
  usedIngredients: string[];
  /** 作るために買い足しが必要な食材。 */
  missingIngredients: string[];
  recipe: RecipeSuggestion;
}

/**
 * 指定した食材(期限が近いものなど)を使い切るためのレシピを探す。
 * 使える食材が多い順 → 買い足しが少ない順 → 調理時間が短い順で並べる。
 */
export function findRecipesUsing(
  recipes: LocalRecipe[],
  inventory: InventoryItem[],
  targetNames: string[],
  limit = 20,
): UseUpResult[] {
  if (targetNames.length === 0) return [];

  const results: UseUpResult[] = [];

  for (const recipe of recipes) {
    // このレシピが、指定食材のうちどれを使うか。
    const used = targetNames.filter((target) =>
      recipe.ingredients.some((ing) => !isStaple(ing.name, ing.staple) && namesMatch(ing.name, target)),
    );
    if (used.length === 0) continue;

    const evaluated = evaluate(recipe, inventory);
    results.push({
      usedIngredients: used,
      missingIngredients: evaluated.missing,
      recipe: evaluated.suggestion,
    });
  }

  results.sort((a, b) => {
    if (a.usedIngredients.length !== b.usedIngredients.length) {
      return b.usedIngredients.length - a.usedIngredients.length;
    }
    if (a.missingIngredients.length !== b.missingIngredients.length) {
      return a.missingIngredients.length - b.missingIngredients.length;
    }
    return a.recipe.cookingTimeMinutes - b.recipe.cookingTimeMinutes;
  });

  return results.slice(0, limit);
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
 * 買い足せば作れるレシピを返す(不足が maxMissing 個以下のもの)。
 * missingIngredientName を指定した場合は、その食材が不足リストに含まれるものに絞る。
 * 不足が少ない順 → 調理時間が短い順に並べる。
 */
export function findAlmostMakeableRecipes(
  recipes: LocalRecipe[],
  inventory: InventoryItem[],
  missingIngredientName?: string,
  limit = 20,
  maxMissing = 2,
): { missingIngredients: string[]; recipe: RecipeSuggestion }[] {
  const target = missingIngredientName ? normalize(missingIngredientName) : null;

  const almost = recipes
    .map((r) => evaluate(r, inventory))
    .filter((e) => e.missing.length >= 1 && e.missing.length <= maxMissing)
    .filter((e) => {
      if (!target) return true;
      return e.missing.some((name) => {
        const m = normalize(name);
        return m.includes(target) || target.includes(m);
      });
    });

  almost.sort((a, b) => {
    if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
    return a.recipe.cookingTimeMinutes - b.recipe.cookingTimeMinutes;
  });

  return almost.slice(0, limit).map((e) => ({
    missingIngredients: e.missing,
    recipe: e.suggestion,
  }));
}
