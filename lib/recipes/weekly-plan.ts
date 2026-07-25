import type { RecipeSuggestion } from '@/lib/ai/types';
import type { LocalRecipe } from '@/lib/recipes/types';
import { HIGH_PROTEIN_THRESHOLD } from '@/lib/nutrition';
import { namesMatch, type InventoryItem } from '@/lib/recipes/matcher';
import { isMainDish } from '@/lib/recipes/dish-role';

export interface WeeklyPlanOptions {
  /** 何日分作るか。 */
  days?: number;
  /** 高タンパク(筋トレ向け)を優先するか。 */
  highProtein?: boolean;
  /** 在庫で作れる料理をどれだけ優先するか。 */
  preferStock?: boolean;
  /** 同じ料理を出さないための除外リスト(作り直し時に使う)。 */
  exclude?: string[];
  /** 並びを変えるための種。日ごとに違う献立にするために使う。 */
  seed?: number;
}

export interface PlannedMeal {
  /** 何日目か(0始まり)。 */
  dayIndex: number;
  recipe: RecipeSuggestion;
  /** この料理を作るために買い足しが必要な材料。 */
  missingIngredients: string[];
}

// 主材料が続かないようにするための分類。
const MAIN_GROUPS: [string, string[]][] = [
  ['鶏', ['鶏', 'ささみ', '手羽']],
  ['豚', ['豚']],
  ['牛', ['牛']],
  ['ひき肉', ['ひき肉', '挽肉']],
  ['魚', ['鮭', 'さば', 'ぶり', 'あじ', 'いわし', 'たら', 'まぐろ', 'さんま', '白身魚', 'カレイ']],
  ['魚介', ['エビ', 'イカ', 'たこ', 'あさり', 'ホタテ', '牡蠣']],
  ['卵', ['卵']],
  ['豆腐', ['豆腐', '厚揚げ', '納豆']],
];

function mainGroupOf(recipe: LocalRecipe): string {
  const names = recipe.ingredients.filter((i) => !i.staple).map((i) => i.name);
  for (const [group, words] of MAIN_GROUPS) {
    if (names.some((name) => words.some((w) => name.includes(w)))) return group;
  }
  return 'その他';
}

/** 数値の並びを毎回変えるための簡易乱数(同じseedなら同じ結果)。 */
function pseudoRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

/**
 * 1週間分の献立を組み立てる。
 *
 * ・単体で一食になる料理(主菜・主食)だけを選ぶ
 * ・同じ料理は出さない
 * ・主材料(鶏/豚/魚など)が続かないようにする
 * ・在庫で作れるもの、筋トレ向け(高タンパク)を設定に応じて優先する
 */
export function buildWeeklyPlan(
  recipes: LocalRecipe[],
  inventory: InventoryItem[],
  evaluate: (recipe: LocalRecipe) => { missing: string[]; suggestion: RecipeSuggestion },
  options: WeeklyPlanOptions = {},
): PlannedMeal[] {
  const {
    days = 7,
    highProtein = false,
    preferStock = true,
    exclude = [],
    seed = 1,
  } = options;

  const excluded = new Set(exclude);
  const random = pseudoRandom(seed);

  // 各レシピを一度だけ評価して点数をつける。
  // 副菜(煮卵、キャロットラペなど)は単体で一食にならないので候補から外す。
  const scored = recipes
    .filter((r) => !excluded.has(r.title) && isMainDish(r))
    .map((recipe) => {
      const { missing, suggestion } = evaluate(recipe);
      const protein = suggestion.proteinPerServing ?? 0;

      let score = 0;
      // 買い足しが少ないほど高得点
      if (preferStock) score += Math.max(0, 6 - missing.length) * 10;
      // 筋トレ設定なら、タンパク質が多いほど高得点
      if (highProtein) {
        score += Math.min(protein, 60);
        if (protein >= HIGH_PROTEIN_THRESHOLD) score += 20;
      }
      // 作るのが現実的な時間を少し優遇
      if (recipe.cookingTimeMinutes <= 30) score += 5;
      // 同点のものが毎回同じ順にならないよう、わずかに散らす
      score += random() * 8;

      return { recipe, suggestion, missing, protein, group: mainGroupOf(recipe), score };
    })
    .sort((a, b) => b.score - a.score);

  const plan: PlannedMeal[] = [];
  const usedTitles = new Set<string>();
  let previousGroup = '';

  for (let day = 0; day < days; day++) {
    // 前日と主材料が違うものを優先し、見つからなければ条件を緩める。
    const pick =
      scored.find((c) => !usedTitles.has(c.recipe.title) && c.group !== previousGroup) ??
      scored.find((c) => !usedTitles.has(c.recipe.title));

    if (!pick) break;

    usedTitles.add(pick.recipe.title);
    previousGroup = pick.group;
    plan.push({
      dayIndex: day,
      recipe: pick.suggestion,
      missingIngredients: pick.missing,
    });
  }

  return plan;
}

/**
 * 献立全体で足りない材料をまとめる(同じ材料は1つにまとめる)。
 */
export function collectMissingIngredients(meals: PlannedMeal[]): string[] {
  const result: string[] = [];
  for (const meal of meals) {
    for (const name of meal.missingIngredients) {
      if (!result.some((existing) => namesMatch(existing, name))) result.push(name);
    }
  }
  return result;
}
