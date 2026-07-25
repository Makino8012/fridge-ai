import { describe, expect, it } from 'vitest';
import recipesData from '@/data/recipes.json';
import { estimateProteinPerServing } from '@/lib/nutrition';
import type { LocalRecipe } from '@/lib/recipes/types';

describe('筋トレ向けレシピ', () => {
  const rs = recipesData as LocalRecipe[];

  it('「筋トレ」タグのレシピは実際に高タンパク', () => {
    const training = rs.filter((r) => r.tags.includes('筋トレ'));
    expect(training.length).toBeGreaterThan(20);

    const low = training
      .map((r) => ({ t: r.title, p: estimateProteinPerServing(r.ingredients) }))
      .filter((x) => x.p < 25);
    expect(low, `25g未満: ${low.map((x) => `${x.t}(${x.p}g)`).join(', ')}`).toHaveLength(0);
  });

  it('高タンパクレシピが十分な数ある', () => {
    const high = rs.filter((r) => estimateProteinPerServing(r.ingredients) >= 25);
    expect(high.length).toBeGreaterThan(120);
  });
});
