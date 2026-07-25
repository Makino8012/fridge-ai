import { describe, expect, it } from 'vitest';
import recipesData from '@/data/recipes.json';
import { findMakeableRecipes, type InventoryItem } from './matcher';
import type { LocalRecipe } from './types';

const RECIPES = recipesData as LocalRecipe[];
const inv = (names: string[]): InventoryItem[] =>
  names.map((name) => ({ name, expiringSoon: false }));

describe('実際のレシピ辞書での判定', () => {
  it('在庫が空なら作れる料理は0件', () => {
    expect(findMakeableRecipes(RECIPES, inv([]), undefined, 999)).toHaveLength(0);
  });

  it('よくある在庫で、作れる料理がちゃんと見つかる', () => {
    const result = findMakeableRecipes(
      RECIPES,
      inv(['豚こま肉', '玉ねぎ', 'キャベツ', '卵', 'にんじん', 'じゃがいも']),
      undefined,
      999,
    );
    expect(result.length).toBeGreaterThan(3);
  });

  it('提案された料理の材料は、常備品以外すべて在庫にある', () => {
    const stock = ['豚こま肉', '玉ねぎ', 'キャベツ', '卵'];
    const result = findMakeableRecipes(RECIPES, inv(stock), undefined, 999);

    for (const recipe of result) {
      for (const ing of recipe.ingredients) {
        // owned かつ staple でない材料は、必ず在庫のどれかと対応しているはず
        expect(ing.owned).toBe(true);
      }
    }
  });

  it('「ねぎ」だけの在庫で玉ねぎ料理が作れる判定にならない', () => {
    const result = findMakeableRecipes(RECIPES, inv(['ねぎ']), undefined, 999);
    const usesOnion = result.some((r) => r.ingredients.some((i) => i.name.includes('玉ねぎ')));
    expect(usesOnion).toBe(false);
  });
});
