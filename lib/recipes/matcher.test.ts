import { describe, expect, it } from 'vitest';
import {
  findAlmostMakeableRecipes,
  findMakeableRecipes,
  findSeasonalRecipes,
  type InventoryItem,
} from './matcher';
import type { LocalRecipe } from './types';

const recipes: LocalRecipe[] = [
  {
    title: '生姜焼き',
    difficulty: 'easy',
    cookingTimeMinutes: 15,
    ingredients: [
      { name: '豚こま肉', quantity: '200g', staple: false },
      { name: '玉ねぎ', quantity: '1個', staple: false },
      { name: '醤油', quantity: '大さじ1', staple: true },
    ],
    steps: ['炒める'],
    tags: ['和食'],
    seasons: ['all'],
  },
  {
    title: '肉じゃが',
    difficulty: 'normal',
    cookingTimeMinutes: 35,
    ingredients: [
      { name: 'じゃがいも', quantity: '3個', staple: false },
      { name: 'にんじん', quantity: '1本', staple: false },
      { name: '豚こま肉', quantity: '150g', staple: false },
    ],
    steps: ['煮る'],
    tags: ['和食'],
    seasons: ['winter'],
  },
];

function inv(names: string[], expiring: string[] = []): InventoryItem[] {
  return names.map((name) => ({ name, expiringSoon: expiring.includes(name) }));
}

describe('findMakeableRecipes', () => {
  it('returns recipes whose non-staple ingredients are all in inventory', () => {
    const result = findMakeableRecipes(recipes, inv(['豚こま肉', '玉ねぎ']));
    expect(result.map((r) => r.title)).toEqual(['生姜焼き']);
  });

  it('treats staples as always owned', () => {
    const result = findMakeableRecipes(recipes, inv(['豚こま肉', '玉ねぎ']));
    const shoyu = result[0]!.ingredients.find((i) => i.name === '醤油');
    expect(shoyu?.owned).toBe(true);
  });

  it('matches loosely (豚肉 matches 豚こま肉)', () => {
    const result = findMakeableRecipes(recipes, inv(['豚肉', '玉ねぎ']));
    expect(result.map((r) => r.title)).toContain('生姜焼き');
  });

  it('prioritizes recipes using expiring ingredients', () => {
    const bothMakeable = findMakeableRecipes(
      recipes,
      inv(['豚こま肉', '玉ねぎ', 'じゃがいも', 'にんじん'], ['じゃがいも']),
    );
    expect(bothMakeable[0]!.title).toBe('肉じゃが');
    expect(bothMakeable[0]!.usesExpiringIngredient).toBe(true);
  });

  it('excludes recipes missing a non-staple ingredient', () => {
    const result = findMakeableRecipes(recipes, inv(['玉ねぎ']));
    expect(result).toHaveLength(0);
  });
});

describe('findMakeableRecipes with season', () => {
  const seasonalRecipes: LocalRecipe[] = [
    {
      title: '冬料理',
      difficulty: 'normal',
      cookingTimeMinutes: 40,
      ingredients: [{ name: '大根', quantity: '1本', staple: false }],
      steps: ['煮る'],
      tags: [],
      seasons: ['winter'],
    },
    {
      title: '夏料理',
      difficulty: 'easy',
      cookingTimeMinutes: 10,
      ingredients: [{ name: 'なす', quantity: '1本', staple: false }],
      steps: ['炒める'],
      tags: [],
      seasons: ['summer'],
    },
  ];

  it('prioritizes in-season recipes even when they take longer to cook', () => {
    const stock = inv(['大根', 'なす']);
    const inWinter = findMakeableRecipes(seasonalRecipes, stock, 'winter');
    expect(inWinter[0]!.title).toBe('冬料理'); // 旬なので調理時間が長くても優先
    const inSummer = findMakeableRecipes(seasonalRecipes, stock, 'summer');
    expect(inSummer[0]!.title).toBe('夏料理');
  });
});

describe('findSeasonalRecipes', () => {
  it('returns only recipes tagged with the given season', () => {
    const result = findSeasonalRecipes(recipes, inv([]), 'winter');
    expect(result.map((r) => r.recipe.title)).toEqual(['肉じゃが']);
  });

  it('excludes all-season recipes (shows season-specific ones)', () => {
    const result = findSeasonalRecipes(recipes, inv([]), 'summer');
    expect(result).toHaveLength(0);
  });

  it('reports how many ingredients are missing', () => {
    const result = findSeasonalRecipes(recipes, inv(['じゃがいも', 'にんじん', '豚こま肉']), 'winter');
    expect(result[0]!.missingCount).toBe(0);
  });
});

describe('findAlmostMakeableRecipes', () => {
  it('returns recipes missing exactly one non-staple ingredient', () => {
    const result = findAlmostMakeableRecipes(recipes, inv(['豚こま肉']));
    const titles = result.map((r) => r.recipe.title);
    expect(titles).toContain('生姜焼き');
    const shogayaki = result.find((r) => r.recipe.title === '生姜焼き');
    expect(shogayaki?.missingIngredient).toBe('玉ねぎ');
  });

  it('filters by the specified missing ingredient name', () => {
    const result = findAlmostMakeableRecipes(recipes, inv(['豚こま肉']), 'にんじん');
    expect(result.every((r) => r.missingIngredient.includes('にんじん'))).toBe(true);
  });

  it('marks the missing ingredient as not owned', () => {
    const result = findAlmostMakeableRecipes(recipes, inv(['豚こま肉']), '玉ねぎ');
    const shogayaki = result.find((r) => r.recipe.title === '生姜焼き');
    const onion = shogayaki?.recipe.ingredients.find((i) => i.name === '玉ねぎ');
    expect(onion?.owned).toBe(false);
  });
});
