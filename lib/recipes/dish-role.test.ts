import { describe, expect, it } from 'vitest';
import recipes from '@/data/recipes.json';
import { ROLE_TAGS, dishRole, isMainDish } from '@/lib/recipes/dish-role';
import type { LocalRecipe } from '@/lib/recipes/types';

const ALL = recipes as unknown as LocalRecipe[];

function byTitle(title: string): LocalRecipe {
  const found = ALL.find((r) => r.title === title);
  if (!found) throw new Error(`レシピ辞書に「${title}」がありません`);
  return found;
}

describe('dishRole', () => {
  // 「3日目: 煮卵」が一食として出てきたのが発端。実データで再発を防ぐ。
  it.each(['煮卵', 'キャロットラペ', 'ちくわの天ぷら', 'なめたけ(自家製)', 'きなこヨーグルト'])(
    '%s は単体で一食にしない',
    (title) => {
      expect(dishRole(byTitle(title))).toBe('side');
    },
  );

  it.each(['肉じゃが', '豚の角煮', 'ロールキャベツ', 'たこ焼き', 'カレーライス'])(
    '%s は一食として出してよい',
    (title) => {
      expect(dishRole(byTitle(title))).toBe('main');
    },
  );

  it('レシピ辞書の全件が主菜か副菜に分類できる', () => {
    for (const recipe of ALL) {
      expect(['main', 'side']).toContain(dishRole(recipe));
    }
  });

  it('献立に使える主菜が十分にある', () => {
    // 少なすぎると1週間分が組めない。
    expect(ALL.filter(isMainDish).length).toBeGreaterThan(500);
  });

  // 推定に頼ると肉じゃがが副菜になるなど外すので、辞書側は必ずタグを持たせる。
  it('レシピ辞書の全件が役割タグを持っている', () => {
    const untagged = ALL.filter((r) => !(r.tags ?? []).some((t) => ROLE_TAGS.includes(t)));
    expect(untagged.map((r) => r.title)).toEqual([]);
  });

  it('主菜タグが副菜タグより優先される', () => {
    const recipe = {
      ingredients: [{ name: '鶏むね肉', quantity: '200g', staple: false }],
      tags: ['副菜', '主菜'],
    };
    expect(dishRole(recipe)).toBe('main');
  });

  it('タグが無くても主食が入っていれば一食とみなす', () => {
    const recipe = {
      ingredients: [
        { name: 'ご飯', quantity: '2膳', staple: false },
        { name: 'のり', quantity: '2枚', staple: false },
      ],
      tags: [],
    };
    expect(dishRole(recipe)).toBe('main');
  });
});
