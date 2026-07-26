import { describe, expect, it } from 'vitest';
import recipesData from '@/data/recipes.json';
import { isBasicStaple } from '@/lib/recipes/staples';
import { evaluateRecipe, type InventoryItem } from '@/lib/recipes/matcher';
import type { LocalRecipe } from '@/lib/recipes/types';

const RECIPES = recipesData as LocalRecipe[];
const inv = (names: string[]): InventoryItem[] =>
  names.map((name) => ({ name, expiringSoon: false }));

describe('isBasicStaple', () => {
  it.each(['塩', '砂糖', '醤油', '味噌', 'みりん', 'ごま油', '片栗粉', 'バター', 'マヨネーズ'])(
    '%s はどの家にもある前提でよい',
    (name) => {
      expect(isBasicStaple(name)).toBe(true);
    },
  );

  // 「常備に材料が全然家にないものもある」という指摘への対応。
  it.each([
    '鶏がらスープの素',
    'オイスターソース',
    'ナンプラー',
    'コチュジャン',
    '豆板醤',
    '練りごま',
    'わさび',
    'パン粉',
  ])('%s は家庭によって無いので在庫を確認する', (name) => {
    expect(isBasicStaple(name)).toBe(false);
  });

  it('にんにくと生姜は生鮮食品なので在庫を確認する', () => {
    expect(isBasicStaple('にんにく')).toBe(false);
    expect(isBasicStaple('生姜')).toBe(false);
  });

  it('表記ゆれを吸収する', () => {
    expect(isBasicStaple('しょうゆ')).toBe(false); // ひらがな表記は辞書に無い
    expect(isBasicStaple('醤油 ')).toBe(true);
    expect(isBasicStaple('水溶き片栗粉')).toBe(true);
  });
});

describe('レシピ評価での扱い', () => {
  it('持っていない調味料は不足として出る', () => {
    const recipe: LocalRecipe = {
      title: 'テスト炒め',
      difficulty: 'easy',
      cookingTimeMinutes: 10,
      ingredients: [
        { name: 'キャベツ', quantity: '1/4個', staple: false },
        { name: '醤油', quantity: '大さじ1', staple: true },
        { name: 'オイスターソース', quantity: '大さじ1', staple: true },
      ],
      steps: ['炒める'],
      tags: ['主菜'],
      seasons: ['all'],
    };

    const result = evaluateRecipe(recipe, inv(['キャベツ']));
    expect(result.missing).toEqual(['オイスターソース']);

    // 在庫に入れれば作れるようになる
    const withSauce = evaluateRecipe(recipe, inv(['キャベツ', 'オイスターソース']));
    expect(withSauce.missing).toEqual([]);
  });

  it('辞書の常備材料のうち、基礎調味料は全体の一部にとどまる', () => {
    const stapleNames = [
      ...new Set(
        RECIPES.flatMap((r) => r.ingredients.filter((i) => i.staple).map((i) => i.name)),
      ),
    ];
    const basic = stapleNames.filter(isBasicStaple);
    // 大半は家庭によって有無が分かれるものなので、持っている前提にはしない。
    expect(basic.length).toBeLessThan(stapleNames.length / 2);
  });
});
