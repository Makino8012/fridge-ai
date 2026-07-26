/**
 * データベースのエラーを、利用者が読んで何をすればいいか分かる文にする。
 *
 * 「追加に失敗しました」とだけ出ると、通信の問題なのか、入力の問題なのか、
 * アプリ側の設定漏れなのかが区別できず、原因にたどり着けない。
 */

/** PostgreSQL のエラーコード。 */
const FOREIGN_KEY_VIOLATION = '23503';
const UNIQUE_VIOLATION = '23505';

function codeOf(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function messageOf(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' ? message : '';
}

/**
 * 食材の登録・更新で起きたエラーの説明。
 *
 * @param fallback 特定できなかったときの文言
 */
export function describeIngredientError(error: unknown, fallback: string): string {
  const code = codeOf(error);

  // カテゴリーや保存場所のマスターに無いIDを指定した場合。
  // 卵・乳製品・米穀物などを後から足したとき、DB側の追加を忘れていると起きる。
  if (code === FOREIGN_KEY_VIOLATION) {
    if (messageOf(error).includes('category')) {
      return 'この種類がデータベースに登録されていません。設定のカテゴリー追加が必要です';
    }
    return '保存場所か種類の設定が見つかりませんでした';
  }

  if (code === UNIQUE_VIOLATION) {
    return '同じ食材が既に登録されています';
  }

  return fallback;
}
