import { describe, expect, it } from 'vitest';
import recipesData from '@/data/recipes.json';
import { buildWeeklyPlan, collectMissingIngredients } from './weekly-plan';
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

describe('buildWeeklyPlan', () => {
  // 「3日目: 煮卵」が一食として出てきた不具合の再発防止。
  it('副菜だけの日を作らない', () => {
    const meals = plan(['卵', '醤油', 'みりん', '砂糖'], { days: 7 });
    const sideDishes = meals.filter((m) => {
      const source = RECIPES.find((r) => r.title === m.recipe.title)!;
      return !isMainDish(source);
    });
    expect(sideDishes.map((m) => m.recipe.title)).toEqual([]);
  });

  it('在庫が卵だけでも煮卵は献立に出さない', () => {
    const titles = plan(['卵'], { days: 5 }).map((m) => m.recipe.title);
    expect(titles).not.toContain('煮卵');
  });

  it('7日分の献立を作る', () => {
    expect(plan(['豚こま肉', '玉ねぎ', 'キャベツ'])).toHaveLength(7);
  });

  it('同じ料理を2回出さない', () => {
    const titles = plan(['豚こま肉', '玉ねぎ']).map((m) => m.recipe.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('日数を指定できる', () => {
    expect(plan(['卵'], { days: 3 })).toHaveLength(3);
  });

  it('除外した料理は出てこない', () => {
    const first = plan(['豚こま肉', '玉ねぎ']);
    const excluded = first[0]!.recipe.title;
    const second = plan(['豚こま肉', '玉ねぎ'], { exclude: [excluded] });
    expect(second.map((m) => m.recipe.title)).not.toContain(excluded);
  });

  it('筋トレ設定にすると高タンパクな料理が中心になる', () => {
    const normal = plan(['豚こま肉', '玉ねぎ', '卵'], { seed: 5 });
    const training = plan(['豚こま肉', '玉ねぎ', '卵'], { highProtein: true, seed: 5 });

    const average = (meals: typeof normal) =>
      meals.reduce((s, m) => s + (m.recipe.proteinPerServing ?? 0), 0) / meals.length;

    expect(average(training)).toBeGreaterThan(average(normal));
    expect(average(training)).toBeGreaterThanOrEqual(25);
  });

  it('在庫優先にすると買い足しが少ない献立になる', () => {
    const stock = ['豚こま肉', '玉ねぎ', 'キャベツ', '卵', 'にんじん', 'じゃがいも'];
    const withStock = plan(stock, { preferStock: true, seed: 3 });
    const totalMissing = withStock.reduce((s, m) => s + m.missingIngredients.length, 0);
    expect(totalMissing).toBeLessThan(withStock.length * 3);
  });
});

describe('collectMissingIngredients', () => {
  it('重複する材料をまとめる', () => {
    const meals = [
      { dayIndex: 0, recipe: {} as never, missingIngredients: ['玉ねぎ', 'にんじん'] },
      { dayIndex: 1, recipe: {} as never, missingIngredients: ['玉ねぎ', '豚こま肉'] },
    ];
    expect(collectMissingIngredients(meals)).toEqual(['玉ねぎ', 'にんじん', '豚こま肉']);
  });
});
