import { describe, expect, it } from 'vitest';
import { formatQuantity, isMeasureUnit, parseQuantity, stepForQuantity } from '@/lib/quantity';

describe('formatQuantity', () => {
  it('formats common fractions as symbols', () => {
    expect(formatQuantity(0.25)).toBe('¼');
    expect(formatQuantity(0.5)).toBe('½');
    expect(formatQuantity(0.75)).toBe('¾');
  });

  it('formats mixed numbers', () => {
    expect(formatQuantity(1.5)).toBe('1½');
    expect(formatQuantity(2.25)).toBe('2¼');
  });

  it('formats whole numbers plainly', () => {
    expect(formatQuantity(2)).toBe('2');
    expect(formatQuantity(130)).toBe('130');
  });

  it('falls back to decimals for non-standard fractions', () => {
    expect(formatQuantity(0.1)).toBe('0.1');
  });
});

describe('parseQuantity', () => {
  it('parses slash fractions', () => {
    expect(parseQuantity('1/2')).toBe(0.5);
    expect(parseQuantity('1/4')).toBe(0.25);
    expect(parseQuantity('3/4')).toBe(0.75);
  });

  it('parses mixed numbers', () => {
    expect(parseQuantity('1 1/2')).toBe(1.5);
  });

  it('parses unicode fractions', () => {
    expect(parseQuantity('½')).toBe(0.5);
    expect(parseQuantity('1½')).toBe(1.5);
  });

  it('parses decimals and integers', () => {
    expect(parseQuantity('0.5')).toBe(0.5);
    expect(parseQuantity('3')).toBe(3);
  });

  it('returns null for invalid input', () => {
    expect(parseQuantity('')).toBeNull();
    expect(parseQuantity('abc')).toBeNull();
    expect(parseQuantity('1/0')).toBeNull();
    expect(parseQuantity('-1')).toBeNull();
  });
});

describe('stepForQuantity', () => {
  it('uses 0.25 steps for small countable quantities', () => {
    expect(stepForQuantity(1, '個')).toBe(0.25);
    expect(stepForQuantity(2, '本')).toBe(0.25);
  });

  it('uses 1 step for larger countable quantities', () => {
    expect(stepForQuantity(10, '個')).toBe(1);
  });

  it('uses volume-based steps for measure units', () => {
    expect(stepForQuantity(1, 'ml')).toBe(1);
    expect(stepForQuantity(300, 'ml')).toBe(10);
    expect(stepForQuantity(600, 'g')).toBe(50);
  });
});

describe('isMeasureUnit', () => {
  it('detects measure units', () => {
    expect(isMeasureUnit('g')).toBe(true);
    expect(isMeasureUnit('ml')).toBe(true);
    expect(isMeasureUnit('kg')).toBe(true);
  });

  it('treats countable units as non-measure', () => {
    expect(isMeasureUnit('個')).toBe(false);
    expect(isMeasureUnit('本')).toBe(false);
    expect(isMeasureUnit('玉')).toBe(false);
  });
});
