import { describe, expect, it } from 'vitest';
import { estimateProteinPerServing, isHighProtein } from '@/lib/nutrition';

const ing = (name: string, quantity: string, staple = false) => ({ name, quantity, staple });

describe('estimateProteinPerServing', () => {
  it('counts meat by weight', () => {
    // 鶏むね肉300g = 約69g → 2人前で約35g
    const p = estimateProteinPerServing([ing('鶏むね肉', '300g')]);
    expect(p).toBeGreaterThan(30);
    expect(p).toBeLessThan(40);
  });

  it('counts eggs by piece', () => {
    // 卵4個 = 200g × 12% = 24g → 2人前で12g
    const p = estimateProteinPerServing([ing('卵', '4個')]);
    expect(p).toBeGreaterThan(9);
    expect(p).toBeLessThan(15);
  });

  it('ignores seasonings', () => {
    const p = estimateProteinPerServing([ing('醤油', '大さじ2', true), ing('塩', '少々', true)]);
    expect(p).toBe(0);
  });

  it('ignores amounts it cannot measure', () => {
    expect(estimateProteinPerServing([ing('鶏むね肉', '適量')])).toBe(0);
  });

  it('adds up several protein sources', () => {
    const p = estimateProteinPerServing([ing('豚こま肉', '200g'), ing('卵', '2個'), ing('豆腐', '1丁')]);
    expect(p).toBeGreaterThan(25);
  });

  it('marks high protein meals', () => {
    expect(isHighProtein(30)).toBe(true);
    expect(isHighProtein(10)).toBe(false);
  });
});
