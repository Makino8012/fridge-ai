import { describe, expect, it } from 'vitest';
import recipesData from '@/data/recipes.json';
import { browseRecipes, type InventoryItem } from '@/lib/recipes/matcher';
import type { LocalRecipe } from '@/lib/recipes/types';

const RECIPES = recipesData as LocalRecipe[];
const EMPTY: InventoryItem[] = [];

describe('browseRecipes', () => {
  // 以前は200件で打ち切っていて、残りのレシピにたどり着けなかった。
  it('絞り込みなしでも全件数を返す', () => {
    const listing = browseRecipes(RECIPES, EMPTY, {});
    expect(listing.total).toBe(RECIPES.length);
  });

  it('1ページ分だけを返す', () => {
    const listing = browseRecipes(RECIPES, EMPTY, { limit: 60 });
    expect(listing.items).toHaveLength(60);
    expect(listing.total).toBeGreaterThan(60);
  });

  it('続きから読み込める', () => {
    const first = browseRecipes(RECIPES, EMPTY, { limit: 60 });
    const second = browseRecipes(RECIPES, EMPTY, { limit: 60, offset: 60 });
    expect(second.items).toHaveLength(60);
    expect(second.items[0]!.recipe.title).not.toBe(first.items[0]!.recipe.title);
  });

  it('ページを送っていけば最後まで到達できる', () => {
    const limit = 200;
    const titles = new Set<string>();
    for (let offset = 0; offset < RECIPES.length; offset += limit) {
      for (const item of browseRecipes(RECIPES, EMPTY, { limit, offset }).items) {
        titles.add(item.recipe.title);
      }
    }
    expect(titles.size).toBe(RECIPES.length);
  });

  it('絞り込むと全件数もその分だけになる', () => {
    const listing = browseRecipes(RECIPES, EMPTY, { tag: '汁物' });
    expect(listing.total).toBeGreaterThan(100);
    expect(listing.total).toBeLessThan(RECIPES.length);
    for (const item of listing.items) {
      const source = RECIPES.find((r) => r.title === item.recipe.title)!;
      expect(source.tags).toContain('汁物');
    }
  });

  it('料理名でも食材名でも探せる', () => {
    expect(browseRecipes(RECIPES, EMPTY, { query: '唐揚げ' }).total).toBeGreaterThan(0);
    expect(browseRecipes(RECIPES, EMPTY, { query: 'キャベツ' }).total).toBeGreaterThan(0);
  });
});
