import { describe, expect, it } from 'vitest';
import { pickStockCheckItems, type StockCheckCandidate } from '@/lib/stock-check';

const NOW = new Date('2026-07-26T12:00:00Z');

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function item(overrides: Partial<StockCheckCandidate> = {}): StockCheckCandidate {
  return {
    id: crypto.randomUUID(),
    name: 'にんじん',
    quantity: 2,
    unit: '本',
    category_id: 'vegetable',
    storage_location_id: 'fridge',
    expiry_date: null,
    updated_at: daysAgo(1),
    ...overrides,
  };
}

describe('pickStockCheckItems', () => {
  it('最近さわった食材は確認対象にしない', () => {
    const result = pickStockCheckItems([item({ updated_at: daysAgo(1) })], NOW);
    expect(result).toEqual([]);
  });

  it('カテゴリの日数を超えたら確認対象にする', () => {
    const result = pickStockCheckItems([item({ updated_at: daysAgo(10) })], NOW);
    expect(result).toHaveLength(1);
    expect(result[0]!.daysSinceUpdate).toBe(10);
    expect(result[0]!.reason).toContain('10日間');
  });

  it('冷凍庫の食材は同じ日数でも急かさない', () => {
    const fridge = pickStockCheckItems([item({ storage_location_id: 'fridge' })], NOW);
    const freezer = pickStockCheckItems(
      [item({ storage_location_id: 'freezer', updated_at: daysAgo(10) })],
      NOW,
    );
    expect(fridge).toEqual([]);
    expect(freezer).toEqual([]);
  });

  it('調味料のような日持ちする物は毎週は聞かない', () => {
    const result = pickStockCheckItems(
      [item({ name: '醤油', category_id: 'seasoning', updated_at: daysAgo(30) })],
      NOW,
    );
    expect(result).toEqual([]);
  });

  it('賞味期限切れは最優先で出す', () => {
    const result = pickStockCheckItems(
      [
        item({ name: '古い牛乳', category_id: 'dairy', expiry_date: daysAgo(3).slice(0, 10) }),
        item({ name: 'キャベツ', updated_at: daysAgo(30) }),
      ],
      NOW,
      1,
    );
    expect(result[0]!.name).toBe('古い牛乳');
    expect(result[0]!.reason).toContain('賞味期限');
  });

  it('在庫0の食材は聞かない', () => {
    const result = pickStockCheckItems([item({ quantity: 0, updated_at: daysAgo(60) })], NOW);
    expect(result).toEqual([]);
  });

  it('一度に出す数を制限する', () => {
    const stale = Array.from({ length: 10 }, (_, i) =>
      item({ name: `野菜${i}`, updated_at: daysAgo(20 + i) }),
    );
    expect(pickStockCheckItems(stale, NOW)).toHaveLength(3);
    expect(pickStockCheckItems(stale, NOW, 5)).toHaveLength(5);
  });

  it('怪しい順に並べる', () => {
    const result = pickStockCheckItems(
      [item({ name: '新しめ', updated_at: daysAgo(8) }), item({ name: '古い', updated_at: daysAgo(40) })],
      NOW,
    );
    expect(result.map((r) => r.name)).toEqual(['古い', '新しめ']);
  });
});
