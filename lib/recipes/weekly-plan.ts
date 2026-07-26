import type { RecipeSuggestion } from '@/lib/ai/types';
import type { LocalRecipe } from '@/lib/recipes/types';
import { HIGH_PROTEIN_THRESHOLD } from '@/lib/nutrition';
import { namesMatch, type InventoryItem } from '@/lib/recipes/matcher';
import { dishCourse, isMainDish, type DishCourse } from '@/lib/recipes/dish-role';

export interface WeeklyPlanOptions {
  /** 何日分作るか。 */
  days?: number;
  /** 高タンパク(筋トレ向け)を優先するか。 */
  highProtein?: boolean;
  /** 在庫で作れる料理をどれだけ優先するか。 */
  preferStock?: boolean;
  /** ジャンルの絞り込み(タグ名)。複数指定するとどれかに当てはまる料理が対象。 */
  genres?: string[];
  /** 主菜1品あたり買い足してよい材料の上限。多すぎる料理は現実的でないので除く。
   *  副菜・汁物は脇役なので買い足し1品以内を優先し、無ければ緩める。 */
  maxMissing?: number;
  /** 一食の品数。1=主菜のみ、2=主菜+副菜、3=主菜+副菜+汁物。 */
  dishesPerMeal?: number;
  /** 同じ料理を出さないための除外リスト(作り直し時に使う)。 */
  exclude?: string[];
  /** 並びを変えるための種。日ごとに違う献立にするために使う。 */
  seed?: number;
}

/** 献立で選べるジャンル。レシピ辞書のタグと対応している。 */
export const PLAN_GENRES: { id: string; label: string }[] = [
  { id: '和食', label: '和食' },
  { id: '洋食', label: '洋食' },
  { id: '中華', label: '中華' },
  { id: '韓国', label: '韓国' },
  { id: 'エスニック', label: 'エスニック' },
  { id: '麺', label: '麺' },
  { id: '丼', label: '丼' },
  { id: 'ヘルシー', label: 'ヘルシー' },
  { id: '背徳飯', label: '背徳飯' },
];

/** 献立の1品。 */
export interface PlannedDish {
  recipe: RecipeSuggestion;
  course: DishCourse;
  /** この料理を作るために買い足しが必要な材料。 */
  missingIngredients: string[];
}

/** 献立の1食分。主菜だけでなく副菜・汁物も含む。 */
export interface PlannedMeal {
  /** 何日目か(0始まり)。 */
  dayIndex: number;
  /** 主菜が先頭。品数の設定に応じて副菜・汁物が続く。 */
  dishes: PlannedDish[];
  /** この一食全体で買い足しが必要な材料(重複を除いたもの)。 */
  missingIngredients: string[];
}

/** 一食の品数。 */
export const DISHES_PER_MEAL_OPTIONS = [1, 2, 3] as const;

/** 副菜・汁物で買い足したい材料の上限。脇役のために買い物を増やしたくない。 */
const SUPPORTING_DISH_MAX_MISSING = 1;

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
 * ・1食を主菜+副菜+汁物で組み立てる(品数は設定で変えられる)
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
    genres = [],
    maxMissing = 5,
    dishesPerMeal = 3,
    exclude = [],
    seed = 1,
  } = options;

  const excluded = new Set(exclude);
  const random = pseudoRandom(seed);

  // ジャンル指定があれば絞る。ただし絞りすぎて献立が組めないなら全体に戻す。
  const genreFiltered =
    genres.length > 0 ? recipes.filter((r) => r.tags.some((t) => genres.includes(t))) : recipes;
  const mainPool = genreFiltered.filter(isMainDish).length >= days ? genreFiltered : recipes;

  /**
   * 候補に点数をつけて高い順に並べる。
   * 副菜・汁物は買い物を増やさないことの方が大事なので、在庫優先を強めにする。
   */
  function scoreCandidates(source: LocalRecipe[], course: DishCourse) {
    const isMain = course === 'main';
    return source
      .filter((r) => !excluded.has(r.title) && dishCourse(r) === course)
      .map((recipe) => {
        const { missing, suggestion } = evaluate(recipe);
        const protein = suggestion.proteinPerServing ?? 0;

        let score = 0;
        if (preferStock) {
          // 主菜は在庫優先を弱めにする。強くしすぎると在庫にある数品だけが
          // 延々と出て献立にならない。逆に副菜・汁物のために買い物が増えるのは避けたい。
          score += isMain
            ? Math.max(0, 3 - missing.length) * 4
            : Math.max(0, 4 - missing.length) * 12;
        }
        // 筋トレ設定なら、タンパク質が多い主菜を優先する
        if (highProtein && isMain) {
          score += Math.min(protein, 60);
          if (protein >= HIGH_PROTEIN_THRESHOLD) score += 20;
        }
        // 作るのが現実的な時間を少し優遇
        if (recipe.cookingTimeMinutes <= 30) score += 5;
        // 毎回同じ献立にならないよう大きめに散らす。
        // 献立は「今週何食べる?」の提案なので、目新しさの方が最適解より大事。
        score += random() * 30;

        return { recipe, suggestion, missing, protein, group: mainGroupOf(recipe), score };
      })
      .sort((a, b) => b.score - a.score);
  }

  // 主菜は買い足しが多すぎる料理を最初から除く。
  const mains = scoreCandidates(mainPool, 'main').filter((c) => c.missing.length <= maxMissing);
  // 副菜と汁物はジャンルで絞らない。和食の主菜に洋風スープが付いても困らないし、
  // 絞ると同じ副菜ばかりになる。
  const sides = scoreCandidates(recipes, 'side');
  const soups = scoreCandidates(recipes, 'soup');

  const plan: PlannedMeal[] = [];
  const usedTitles = new Set<string>();
  let previousGroup = '';

  /**
   * まだ使っていない候補を1つ取る。
   * まず買い足しの少ないものを探し、無ければ条件を緩める。
   * 副菜が付かない日ができるより、買い物が1品増える方がましなため。
   */
  function take(
    candidates: typeof mains,
    preferredMaxMissing: number,
  ): (typeof mains)[number] | undefined {
    const pick =
      candidates.find(
        (c) => !usedTitles.has(c.recipe.title) && c.missing.length <= preferredMaxMissing,
      ) ?? candidates.find((c) => !usedTitles.has(c.recipe.title));
    if (pick) usedTitles.add(pick.recipe.title);
    return pick;
  }

  for (let day = 0; day < days; day++) {
    // 前日と主材料が違うものを優先し、見つからなければ条件を緩める。
    const main =
      mains.find((c) => !usedTitles.has(c.recipe.title) && c.group !== previousGroup) ??
      mains.find((c) => !usedTitles.has(c.recipe.title));

    if (!main) break;

    usedTitles.add(main.recipe.title);
    previousGroup = main.group;

    const dishes: PlannedDish[] = [
      { recipe: main.suggestion, course: 'main', missingIngredients: main.missing },
    ];

    if (dishesPerMeal >= 2) {
      const side = take(sides, SUPPORTING_DISH_MAX_MISSING);
      if (side) {
        dishes.push({ recipe: side.suggestion, course: 'side', missingIngredients: side.missing });
      }
    }

    if (dishesPerMeal >= 3) {
      const soup = take(soups, SUPPORTING_DISH_MAX_MISSING);
      if (soup) {
        dishes.push({ recipe: soup.suggestion, course: 'soup', missingIngredients: soup.missing });
      }
    }

    plan.push({
      dayIndex: day,
      dishes,
      missingIngredients: mergeIngredientNames(dishes.flatMap((d) => d.missingIngredients)),
    });
  }

  return plan;
}

/** 同じ材料をまとめる(表記ゆれも1つに寄せる)。 */
function mergeIngredientNames(names: string[]): string[] {
  const result: string[] = [];
  for (const name of names) {
    if (!result.some((existing) => namesMatch(existing, name))) result.push(name);
  }
  return result;
}

/**
 * 献立全体で足りない材料をまとめる(同じ材料は1つにまとめる)。
 */
export function collectMissingIngredients(meals: PlannedMeal[]): string[] {
  return mergeIngredientNames(meals.flatMap((meal) => meal.missingIngredients));
}
