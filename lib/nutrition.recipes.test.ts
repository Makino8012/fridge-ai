import { describe, expect, it } from 'vitest';
import recipesData from '@/data/recipes.json';
import { estimateProteinPerServing } from '@/lib/nutrition';
import type { LocalRecipe } from '@/lib/recipes/types';

const RECIPES = recipesData as LocalRecipe[];

/** 提供元の数値があればそれを、無ければ材料から見積もった値を返す。 */
function proteinOf(recipe: LocalRecipe): number {
  return recipe.proteinPerServing ?? estimateProteinPerServing(recipe.ingredients);
}

// 「筋トレ」タグを付ける下限(1人分のg)。scripts/import-csv.mjs と揃える。
const TRAINING_THRESHOLD = 20;

describe('筋トレ向けレシピ', () => {
  it('「筋トレ」タグのレシピは実際にタンパク質が多い', () => {
    const training = RECIPES.filter((r) => r.tags.includes('筋トレ'));
    expect(training.length).toBeGreaterThan(50);

    const low = training
      .map((r) => ({ t: r.title, p: proteinOf(r) }))
      .filter((x) => x.p < TRAINING_THRESHOLD);

    expect(
      low,
      `${TRAINING_THRESHOLD}g未満: ${low.map((x) => `${x.t}(${x.p}g)`).join(', ')}`,
    ).toHaveLength(0);
  });

  it('高タンパクレシピが十分な数ある', () => {
    const high = RECIPES.filter((r) => proteinOf(r) >= 25);
    expect(high.length).toBeGreaterThan(150);
  });

  it('タンパク質の数値を持つレシピは妥当な範囲に収まっている', () => {
    const withValue = RECIPES.filter((r) => r.proteinPerServing !== undefined);
    expect(withValue.length).toBeGreaterThan(90);

    const odd = withValue.filter((r) => r.proteinPerServing! <= 0 || r.proteinPerServing! > 100);
    expect(odd.map((r) => r.title)).toEqual([]);
  });
});
