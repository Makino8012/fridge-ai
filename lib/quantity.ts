// 在庫の数量は数値で保持するが、野菜など「1/2個」「1/4個」といった分数を
// 自然に表示・入力・増減できるようにするためのユーティリティ。

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

// 表示に使う分数記号(端数がこれらに近ければ記号に置き換える)。
const DISPLAY_FRACTIONS: { value: number; symbol: string }[] = [
  { value: 0.25, symbol: '¼' },
  { value: 1 / 3, symbol: '⅓' },
  { value: 0.5, symbol: '½' },
  { value: 2 / 3, symbol: '⅔' },
  { value: 0.75, symbol: '¾' },
];

const MEASURE_UNIT_HINTS = ['g', 'ml', 'cc', 'kg', 'mg', 'l', 'リットル', 'グラム', 'ミリ', 'cl', 'dl'];

/** g・mlなどの計量単位か(個・本などの「数えるもの」と区別する)。 */
export function isMeasureUnit(unit: string): boolean {
  const u = unit.trim().toLowerCase();
  if (u === '') return false;
  return MEASURE_UNIT_HINTS.some((m) => u === m || u.includes(m));
}

/**
 * 数量を人が読みやすい文字列にする。
 * 例: 0.5 → "½"、0.25 → "¼"、1.5 → "1½"、2 → "2"、130 → "130"
 */
export function formatQuantity(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0';
  const rounded = Math.round(n * 1000) / 1000;
  const whole = Math.floor(rounded + 1e-9);
  const frac = rounded - whole;

  if (frac < 0.01) return String(whole);

  for (const { value, symbol } of DISPLAY_FRACTIONS) {
    if (Math.abs(frac - value) < 0.02) {
      return whole > 0 ? `${whole}${symbol}` : symbol;
    }
  }
  // きれいな分数にならない場合は小数第2位までで表示。
  return String(Math.round(rounded * 100) / 100);
}

/**
 * 「1/2」「1 1/2」「1½」「½」「0.5」などの入力を数値に変換する。
 * 解釈できないときは null。
 */
export function parseQuantity(input: string): number | null {
  if (input == null) return null;
  let s = input.trim();
  if (s === '') return null;

  // Unicodeの分数記号を数値として抜き出す(「1½」のような混在にも対応)。
  let total = 0;
  s = s.replace(/[½⅓⅔¼¾⅛⅜⅝⅞]/g, (m) => {
    total += UNICODE_FRACTIONS[m] ?? 0;
    return ' ';
  });
  s = s.trim();

  if (s !== '') {
    for (const part of s.split(/\s+/)) {
      if (part.includes('/')) {
        const [a, b] = part.split('/');
        const num = Number(a);
        const den = Number(b);
        if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
        total += num / den;
      } else {
        const v = Number(part);
        if (!Number.isFinite(v)) return null;
        total += v;
      }
    }
  }

  if (!Number.isFinite(total) || total < 0) return null;
  return Math.round(total * 1000) / 1000;
}

/**
 * 数量の大きさと単位に応じた増減の刻み。
 * 個・本などの数えるものは、少量のとき0.25刻みで1/4・1/2を扱えるようにする。
 * g・mlなどは従来どおり量に応じた刻み。
 */
export function stepForQuantity(quantity: number, unit: string): number {
  const countable = !isMeasureUnit(unit);
  if (countable && quantity <= 3) return 0.25;
  if (quantity >= 500) return 50;
  if (quantity >= 100) return 10;
  if (quantity >= 20) return 5;
  return 1;
}

/** 浮動小数の誤差をならして丸める(0.25刻みの加算で 0.7500001 などになるのを防ぐ)。 */
export function roundQuantity(n: number): number {
  return Math.round(n * 1000) / 1000;
}
