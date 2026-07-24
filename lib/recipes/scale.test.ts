import { describe, expect, it } from 'vitest';
import { scaleQuantity, servingsRatio } from './scale';

describe('servingsRatio', () => {
  it('returns 1 at the base of 2 servings', () => {
    expect(servingsRatio(2)).toBe(1);
  });
  it('doubles at 4 servings, halves at 1', () => {
    expect(servingsRatio(4)).toBe(2);
    expect(servingsRatio(1)).toBe(0.5);
  });
});

describe('scaleQuantity', () => {
  it('returns unchanged at ratio 1', () => {
    expect(scaleQuantity('200g', 1)).toBe('200g');
  });

  it('scales a simple gram amount', () => {
    expect(scaleQuantity('200g', 2)).toBe('400g');
    expect(scaleQuantity('200g', 0.5)).toBe('100g');
  });

  it('scales the number after 大さじ/小さじ, keeping the unit word', () => {
    expect(scaleQuantity('大さじ2', 2)).toBe('大さじ4');
    expect(scaleQuantity('小さじ1', 0.5)).toBe('小さじ0.5');
  });

  it('scales fractions', () => {
    expect(scaleQuantity('1/2個', 2)).toBe('1個');
    expect(scaleQuantity('1/2個', 1.5)).toBe('0.75個');
  });

  it('scales every number in a range', () => {
    expect(scaleQuantity('2〜3本', 2)).toBe('4〜6本');
  });

  it('leaves vague amounts untouched', () => {
    expect(scaleQuantity('適量', 2)).toBe('適量');
    expect(scaleQuantity('少々', 3)).toBe('少々');
    expect(scaleQuantity('人数分', 2)).toBe('人数分');
  });

  it('leaves non-numeric text untouched', () => {
    expect(scaleQuantity('ひとつまみ', 2)).toBe('ひとつまみ');
  });
});
