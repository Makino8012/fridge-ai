import { describe, expect, it } from 'vitest';
import recipesData from '@/data/recipes.json';
import { STAPLE_CATEGORIES, stepOfUnit } from '@/lib/staple-foods';
import { namesMatch } from '@/lib/recipes/matcher';
import type { LocalRecipe } from '@/lib/recipes/types';

const RECIPES = recipesData as LocalRecipe[];
const ALL_ITEMS = STAPLE_CATEGORIES.flatMap((c) => c.groups.flatMap((g) => g.items));
const RECIPE_NAMES = [
  ...new Set(RECIPES.flatMap((r) => r.ingredients.filter((i) => !i.staple).map((i) => i.name))),
];

describe('定番食材のカタログ', () => {
  // 名前がレシピ側とずれると「在庫にあるのに作れない」が起きる。
  it('すべての定番食材が、レシピの材料と照合できる', () => {
    const unmatched = ALL_ITEMS.filter(
      (item) => !RECIPE_NAMES.some((name) => namesMatch(name, item.name)),
    );
    expect(unmatched.map((i) => i.name)).toEqual([]);
  });

  it('名前が重複していない', () => {
    const names = ALL_ITEMS.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('よく使われる肉が網羅されている', () => {
    const names = ALL_ITEMS.map((i) => i.name);
    for (const meat of ['鶏もも肉', '鶏むね肉', '豚こま肉', '豚バラ肉', '豚ロース肉', '牛こま肉']) {
      expect(names).toContain(meat);
    }
  });

  it('g や ml は1ずつではなくまとめて増減する', () => {
    expect(stepOfUnit('g')).toBe(50);
    expect(stepOfUnit('ml')).toBe(100);
    expect(stepOfUnit('個')).toBe(1);
  });
});
