import { describe, expect, it } from 'vitest';
import recipesData from '@/data/recipes.json';
import { buildWeeklyPlan, collectMissingIngredients, type PlannedMeal } from './weekly-plan';
import { evaluateRecipe, type InventoryItem } from './matcher';
import { isMainDish } from './dish-role';
import type { LocalRecipe } from './types';

const RECIPES = recipesData as LocalRecipe[];
const inv = (names: string[]): InventoryItem[] =>
  names.map((name) => ({ name, expiringSoon: false }));

function plan(stock: string[], options = {}) {
  const inventory = inv(stock);
  return buildWeeklyPlan(RECIPES, inventory, (r) => evaluateRecipe(r, inventory), options);
}

/** その日の主菜。既存の検証はほとんど主菜だけを見ればよい。 */
function mainOf(meal: PlannedMeal) {
  return meal.dishes.find((d) => d.course === 'main')!.recipe;
}

describe('buildWeeklyPlan', () => {
  // 「3日目: 煮卵」が一食として出てきた不具合の再発防止。
  it('副菜だけの日を作らない', () => {
    const meals = plan(['卵', '醤油', 'みりん', '砂糖'], { days: 7 });
    const sideDishes = meals.filter((m) => {
      const source = RECIPES.find((r) => r.title === mainOf(m).title)!;
      return !isMainDish(source);
    });
    expect(sideDishes.map((m) => mainOf(m).title)).toEqual([]);
  });

  it('在庫が卵だけでも煮卵は献立に出さない', () => {
    const titles = plan(['卵'], { days: 5 }).map((m) => mainOf(m).title);
    expect(titles).not.toContain('煮卵');
  });

  // 在庫にある数品だけが延々と出て献立にならなかったため、
  // 在庫優先はあくまで加点にとどめる。
  it('在庫が少なくても買い足しが必要な料理を出す', () => {
    const meals = plan(['卵'], { days: 7 });
    const needsShopping = meals.filter((m) => m.missingIngredients.length > 0);
    expect(needsShopping.length).toBeGreaterThan(0);
  });

  it('買い足しが多すぎる主菜は出さない', () => {
    const meals = plan(['卵'], { days: 7, maxMissing: 3 });
    for (const meal of meals) {
      const main = meal.dishes.find((d) => d.course === 'main')!;
      expect(main.missingIngredients.length).toBeLessThanOrEqual(3);
    }
  });

  it('副菜と汁物のために買い物を増やしすぎない', () => {
    const meals = plan(['豚こま肉', '玉ねぎ', 'にんじん', '豆腐', 'わかめ'], { days: 7 });
    const supporting = meals.flatMap((m) => m.dishes.filter((d) => d.course !== 'main'));
    const cheap = supporting.filter((d) => d.missingIngredients.length <= 1);
    // 大半は在庫か買い足し1品で済むはず。
    expect(cheap.length).toBeGreaterThan(supporting.length / 2);
  });

  it('1食が主菜・副菜・汁物で構成される', () => {
    const meals = plan(['豚こま肉', '玉ねぎ'], { days: 5 });
    for (const meal of meals) {
      expect(meal.dishes.map((d) => d.course)).toEqual(['main', 'side', 'soup']);
    }
  });

  it('品数を減らせる', () => {
    const oneDish = plan(['豚こま肉'], { days: 3, dishesPerMeal: 1 });
    for (const meal of oneDish) expect(meal.dishes).toHaveLength(1);

    const twoDishes = plan(['豚こま肉'], { days: 3, dishesPerMeal: 2 });
    for (const meal of twoDishes) {
      expect(twoDishes[0]!.dishes.map((d) => d.course)).toEqual(['main', 'side']);
      expect(meal.dishes).toHaveLength(2);
    }
  });

  it('同じ副菜を別の日に使い回さない', () => {
    const meals = plan(['豚こま肉', '玉ねぎ'], { days: 7 });
    const titles = meals.flatMap((m) => m.dishes.map((d) => d.recipe.title));
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('ジャンルを指定するとその系統の料理が中心になる', () => {
    const meals = plan(['豚こま肉', '玉ねぎ'], { days: 5, genres: ['中華'] });
    const chinese = meals.filter((m) => {
      const source = RECIPES.find((r) => r.title === mainOf(m).title)!;
      return source.tags.includes('中華');
    });
    expect(chinese).toHaveLength(meals.length);
  });

  it('ジャンルを複数選べる', () => {
    const meals = plan(['豚こま肉'], { days: 5, genres: ['韓国', 'エスニック'] });
    for (const meal of meals) {
      const source = RECIPES.find((r) => r.title === mainOf(meal).title)!;
      expect(source.tags.some((t) => t === '韓国' || t === 'エスニック')).toBe(true);
    }
  });

  it('ジャンルを絞りすぎて日数分そろわないときは全体から選ぶ', () => {
    const meals = plan(['卵'], { days: 7, genres: ['そんなジャンルはない'] });
    expect(meals).toHaveLength(7);
  });

  it('7日分の献立を作る', () => {
    expect(plan(['豚こま肉', '玉ねぎ', 'キャベツ'])).toHaveLength(7);
  });

  it('同じ料理を2回出さない', () => {
    const titles = plan(['豚こま肉', '玉ねぎ']).map((m) => mainOf(m).title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('日数を指定できる', () => {
    expect(plan(['卵'], { days: 3 })).toHaveLength(3);
  });

  it('除外した料理は出てこない', () => {
    const first = plan(['豚こま肉', '玉ねぎ']);
    const excluded = mainOf(first[0]!).title;
    const second = plan(['豚こま肉', '玉ねぎ'], { exclude: [excluded] });
    expect(second.map((m) => mainOf(m).title)).not.toContain(excluded);
  });

  it('筋トレ設定にすると高タンパクな料理が中心になる', () => {
    const normal = plan(['豚こま肉', '玉ねぎ', '卵'], { seed: 5 });
    const training = plan(['豚こま肉', '玉ねぎ', '卵'], { highProtein: true, seed: 5 });

    const average = (meals: typeof normal) =>
      meals.reduce((s, m) => s + (mainOf(m).proteinPerServing ?? 0), 0) / meals.length;

    expect(average(training)).toBeGreaterThan(average(normal));
    expect(average(training)).toBeGreaterThanOrEqual(25);
  });

  it('在庫優先にすると買い足しが少ない献立になる', () => {
    const stock = ['豚こま肉', '玉ねぎ', 'キャベツ', '卵', 'にんじん', 'じゃがいも'];
    const count = (meals: PlannedMeal[]) =>
      meals.reduce((sum, m) => sum + m.missingIngredients.length, 0);

    const withStock = plan(stock, { preferStock: true, seed: 3 });
    const without = plan(stock, { preferStock: false, seed: 3 });
    expect(count(withStock)).toBeLessThan(count(without));
  });
});

describe('collectMissingIngredients', () => {
  it('重複する材料をまとめる', () => {
    const meals = [
      { dayIndex: 0, dishes: [], missingIngredients: ['玉ねぎ', 'にんじん'] },
      { dayIndex: 1, dishes: [], missingIngredients: ['玉ねぎ', '豚こま肉'] },
    ];
    expect(collectMissingIngredients(meals)).toEqual(['玉ねぎ', 'にんじん', '豚こま肉']);
  });
});
