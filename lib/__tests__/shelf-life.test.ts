import { describe, expect, it } from 'vitest';
import { addDays, format } from 'date-fns';
import { effectiveExpiry, estimateShelfLifeDays } from '@/lib/shelf-life';

describe('estimateShelfLifeDays', () => {
  it('傷みやすい物ほど短く見積もる', () => {
    const fish = estimateShelfLifeDays('fish', 'fridge')!;
    const meat = estimateShelfLifeDays('meat', 'fridge')!;
    const vegetable = estimateShelfLifeDays('vegetable', 'fridge')!;
    expect(fish).toBeLessThan(meat);
    expect(meat).toBeLessThan(vegetable);
  });

  it('冷凍すれば大幅に伸びる', () => {
    expect(estimateShelfLifeDays('meat', 'freezer')!).toBeGreaterThan(
      estimateShelfLifeDays('meat', 'fridge')!,
    );
  });

  it('調味料や米は目安を出さない', () => {
    expect(estimateShelfLifeDays('seasoning', 'room_temp')).toBeNull();
    expect(estimateShelfLifeDays('grain', 'room_temp')).toBeNull();
  });
});

describe('effectiveExpiry', () => {
  const base = {
    category_id: 'vegetable' as const,
    storage_location_id: 'fridge' as const,
    created_at: '2026-07-01T00:00:00Z',
  };

  it('入力された期限をそのまま使う', () => {
    const result = effectiveExpiry({ ...base, expiry_date: '2026-07-10' });
    expect(result).toEqual({ date: '2026-07-10', estimated: false });
  });

  it('未入力なら登録日から推定し、推定であることを示す', () => {
    const result = effectiveExpiry({ ...base, expiry_date: null })!;
    expect(result.estimated).toBe(true);
    // 野菜(冷蔵)は7日もつ想定。登録日のローカル日付から7日後。
    expect(result.date).toBe(format(addDays(new Date(base.created_at), 7), 'yyyy-MM-dd'));
  });

  it('目安を出さないカテゴリは null', () => {
    expect(
      effectiveExpiry({ ...base, category_id: 'seasoning', expiry_date: null }),
    ).toBeNull();
  });

  it('登録日が壊れていても落ちない', () => {
    expect(effectiveExpiry({ ...base, created_at: 'not-a-date', expiry_date: null })).toBeNull();
  });
});
