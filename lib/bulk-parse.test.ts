import { describe, expect, it } from 'vitest';
import { parseBulkIngredients } from '@/lib/bulk-parse';

describe('parseBulkIngredients', () => {
  it('splits a shopping sentence into items', () => {
    const result = parseBulkIngredients('牛乳と卵、キャベツ2個、豚こま肉300g');
    expect(result.map((r) => r.name)).toEqual(['牛乳', '卵', 'キャベツ', '豚こま肉']);
  });

  it('reads explicit quantity and unit', () => {
    const [cabbage] = parseBulkIngredients('キャベツ2個');
    expect(cabbage).toMatchObject({ name: 'キャベツ', quantity: 2, unit: '個' });

    const [pork] = parseBulkIngredients('豚こま肉300g');
    expect(pork).toMatchObject({ name: '豚こま肉', quantity: 300, unit: 'g' });
  });

  it('handles fractions and full-width digits', () => {
    expect(parseBulkIngredients('大根1/2本')[0]).toMatchObject({ quantity: 0.5, unit: '本' });
    expect(parseBulkIngredients('トマト３個')[0]).toMatchObject({ quantity: 3, unit: '個' });
  });

  it('normalizes unit spellings', () => {
    expect(parseBulkIngredients('玉ねぎ2コ')[0]).toMatchObject({ unit: '個' });
    expect(parseBulkIngredients('牛乳500cc')[0]).toMatchObject({ unit: 'ml' });
  });

  it('guesses a countable unit when none is written', () => {
    // 「牛乳」だけなら 1ml ではなく 1本
    expect(parseBulkIngredients('牛乳')[0]).toMatchObject({ quantity: 1, unit: '本' });
    // 肉は1パック買いが自然
    expect(parseBulkIngredients('豚こま肉')[0]).toMatchObject({ quantity: 1, unit: 'パック' });
  });

  it('fills in category and storage', () => {
    const [milk] = parseBulkIngredients('牛乳');
    expect(milk).toMatchObject({ categoryId: 'drink', storageLocationId: 'fridge' });

    const [rice] = parseBulkIngredients('米5kg');
    expect(rice).toMatchObject({ categoryId: 'grain', storageLocationId: 'room_temp' });
  });

  it('drops trailing words like 買った', () => {
    const result = parseBulkIngredients('牛乳とキャベツを買った');
    expect(result.map((r) => r.name)).toEqual(['牛乳', 'キャベツ']);
  });

  it('handles line breaks as separators', () => {
    const result = parseBulkIngredients('牛乳\n卵 2パック\nキャベツ');
    expect(result.map((r) => r.name)).toEqual(['牛乳', '卵', 'キャベツ']);
    expect(result[1]).toMatchObject({ quantity: 2, unit: 'パック' });
  });

  it('returns an empty list for blank input', () => {
    expect(parseBulkIngredients('')).toEqual([]);
    expect(parseBulkIngredients('   ')).toEqual([]);
  });
});

describe('parseBulkIngredients / 「と」を含む食材名', () => {
  it('does not split ingredient names that contain と', () => {
    expect(parseBulkIngredients('とうもろこし2本')[0]).toMatchObject({
      name: 'とうもろこし',
      quantity: 2,
      unit: '本',
    });
  });

  it('still splits around them', () => {
    const result = parseBulkIngredients('とうもろこしと牛乳');
    expect(result.map((r) => r.name)).toEqual(['とうもろこし', '牛乳']);
  });
});
