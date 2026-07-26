import { describe, expect, it } from 'vitest';
import { describeIngredientError } from '@/lib/db-error';

describe('describeIngredientError', () => {
  // 卵や乳製品のカテゴリーをDBに追加し忘れていると、
  // 「入れられるものと入れられないものがある」という分かりにくい形で出る。
  it('カテゴリーがDBに無いときは、何をすればいいか分かる文にする', () => {
    const error = {
      code: '23503',
      message: 'insert or update on table "ingredients" violates foreign key constraint "ingredients_category_id_fkey"',
    };
    expect(describeIngredientError(error, 'だめ')).toContain('カテゴリー');
  });

  it('同名の登録は既にある旨を伝える', () => {
    expect(describeIngredientError({ code: '23505', message: 'duplicate key' }, 'だめ')).toContain(
      '既に登録',
    );
  });

  it('分からないエラーは元の文言のままにする', () => {
    expect(describeIngredientError(new Error('network'), '追加に失敗しました')).toBe(
      '追加に失敗しました',
    );
    expect(describeIngredientError(null, '追加に失敗しました')).toBe('追加に失敗しました');
    expect(describeIngredientError(undefined, 'x')).toBe('x');
  });
});
