// レシピ辞書は「2人前」を基本に書かれている。人数に応じて分量文字列を機械的にスケールする。
export const BASE_SERVINGS = 2;

// スケールしない曖昧な分量表現。
const SKIP_TOKENS = ['適量', '少々', 'お好み', 'ひとつまみ', '人数分', '適宜', '少量'];

function formatNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}

/**
 * 「200g」「大さじ2」「1/2個」「2〜3本」などの分量を ratio 倍にする。
 * 「適量」「少々」など数値のないものはそのまま返す。
 */
export function scaleQuantity(quantity: string, ratio: number): string {
  if (ratio === 1) return quantity;
  if (SKIP_TOKENS.some((t) => quantity.includes(t))) return quantity;
  if (!/[0-9]/.test(quantity)) return quantity;

  // 整数・小数・分数(a/b)を含むすべての数値トークンをスケールする。
  return quantity.replace(/(\d+(?:\.\d+)?)(?:\/(\d+))?/g, (_m, a: string, b?: string) => {
    const value = b ? Number(a) / Number(b) : Number(a);
    return formatNumber(value * ratio);
  });
}

/** 基本(2人前)からの倍率を返す。 */
export function servingsRatio(servings: number): number {
  return servings / BASE_SERVINGS;
}
