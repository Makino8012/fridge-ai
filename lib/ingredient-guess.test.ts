import { describe, expect, it } from 'vitest';
import { guessCategory, guessStorage, guessUnit } from '@/lib/ingredient-guess';

describe('guessCategory', () => {
  it('detects meat', () => {
    expect(guessCategory('豚こま肉')).toBe('meat');
    expect(guessCategory('鶏もも')).toBe('meat');
    expect(guessCategory('ベーコン')).toBe('meat');
  });

  it('detects fish', () => {
    expect(guessCategory('鮭')).toBe('fish');
    expect(guessCategory('えび')).toBe('fish');
  });

  it('detects vegetable', () => {
    expect(guessCategory('キャベツ')).toBe('vegetable');
    expect(guessCategory('玉ねぎ')).toBe('vegetable');
  });

  it('detects drink', () => {
    expect(guessCategory('牛乳')).toBe('drink');
  });

  it('detects seasoning', () => {
    expect(guessCategory('醤油')).toBe('seasoning');
  });

  it('puts dairy, eggs and tofu in other', () => {
    expect(guessCategory('チーズ')).toBe('other');
    expect(guessCategory('とろけるチーズ')).toBe('other');
    expect(guessCategory('卵')).toBe('other');
    expect(guessCategory('豆腐')).toBe('other');
  });

  it('returns null for unknown or empty names', () => {
    expect(guessCategory('')).toBeNull();
    expect(guessCategory('あああ')).toBeNull();
  });
});

describe('guessUnit', () => {
  it('suggests ml for liquids', () => {
    expect(guessUnit('牛乳')).toBe('ml');
  });

  it('suggests g for items weighed', () => {
    expect(guessUnit('豚こま肉')).toBe('g');
    expect(guessUnit('チーズ')).toBe('g');
  });

  it('suggests パック for natto and tofu', () => {
    expect(guessUnit('納豆')).toBe('パック');
  });

  it('suggests 枚 for sliced items', () => {
    expect(guessUnit('ハム')).toBe('枚');
  });

  it('returns null when unknown', () => {
    expect(guessUnit('キャベツ')).toBeNull();
  });
});

describe('guessStorage', () => {
  it('puts fresh food in the fridge', () => {
    expect(guessStorage('vegetable', 'キャベツ')).toBe('fridge');
    expect(guessStorage('meat', '豚肉')).toBe('fridge');
  });

  it('puts frozen items in the freezer', () => {
    expect(guessStorage('other', '冷凍うどん')).toBe('freezer');
    expect(guessStorage('frozen', 'アイス')).toBe('freezer');
  });

  it('puts seasonings at room temperature', () => {
    expect(guessStorage('seasoning', '醤油')).toBe('room_temp');
  });

  it('returns null when it cannot tell', () => {
    expect(guessStorage(null, 'あああ')).toBeNull();
  });
});
