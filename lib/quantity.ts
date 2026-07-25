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
  if (countable) {
    const hasFraction = Math.abs(quantity - Math.round(quantity)) > 1e-9;
    // 少量のとき、または既に端数があるときは0.25刻みで微調整できるようにする。
    if (quantity <= 3 || hasFraction) return 0.25;
  }
  if (quantity >= 500) return 50;
  if (quantity >= 100) return 10;
  if (quantity >= 20) return 5;
  return 1;
}

/** 浮動小数の誤差をならして丸める(0.25刻みの加算で 0.7500001 などになるのを防ぐ)。 */
export function roundQuantity(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// ── ざっくり量 ────────────────────────────────────────────────
// もやし1袋・キャベツ・調味料など、数値で管理しづらいものは
// 単位を「ざっくり」にして「たっぷり/半分/残りわずか」で記録する。
// 数量は内部的には数値のままなので、レシピ照合や並び替えはそのまま動く。

export const ROUGH_UNIT = 'ざっくり';

export const ROUGH_LEVELS: { value: number; label: string }[] = [
  { value: 1, label: 'たっぷり' },
  { value: 0.5, label: '半分' },
  { value: 0.25, label: '残りわずか' },
  { value: 0, label: 'なし' },
];

export function isRoughUnit(unit: string): boolean {
  return unit.trim() === ROUGH_UNIT;
}

/** ざっくり量の数値を「たっぷり」などの言葉にする。 */
export function formatRoughQuantity(n: number): string {
  let best = ROUGH_LEVELS[0]!;
  for (const level of ROUGH_LEVELS) {
    if (Math.abs(n - level.value) < Math.abs(n - best.value)) best = level;
  }
  return best.label;
}

/** 在庫カードなどでの表示用。ざっくり量なら言葉、それ以外は「2½個」のように返す。 */
export function displayQuantity(quantity: number, unit: string): string {
  if (isRoughUnit(unit)) return formatRoughQuantity(quantity);
  return `${formatQuantity(quantity)}${unit}`;
}

// ── 単位の表記ゆれ統一 ─────────────────────────────────────────
// 「コ」「ヶ」「玉」→「個」のように、同じ意味の単位を1つに揃える。
// 揃えておくと在庫が二重に増えたり、数量の比較がずれたりしない。

const UNIT_ALIASES: Record<string, string> = {
  コ: '個', ヶ: '個', ケ: '個', こ: '個', 玉: '個',
  グラム: 'g', ｇ: 'g', G: 'g', gr: 'g', ｸﾞﾗﾑ: 'g',
  ミリリットル: 'ml', cc: 'ml', ｍｌ: 'ml', ML: 'ml', mL: 'ml', CC: 'ml',
  キログラム: 'kg', ｋｇ: 'kg', KG: 'kg',
  リットル: 'L', l: 'L', ℓ: 'L', ｌ: 'L',
  ぱっく: 'パック', ﾊﾟｯｸ: 'パック', pack: 'パック', P: 'パック', pc: 'パック',
  ふくろ: '袋', ﾌｸﾛ: '袋', 包: '袋',
  ほん: '本', ﾎﾝ: '本',
  まい: '枚', ﾏｲ: '枚',
  たば: '束', ﾀﾊﾞ: '束', わ: '束',
  丁: '丁', ちょう: '丁',
  大さじ: '大さじ', 小さじ: '小さじ',
};

/** 単位の表記ゆれを揃える(前後の空白も落とす)。 */
export function normalizeUnit(unit: string): string {
  const u = unit.trim();
  if (u === '') return u;
  return UNIT_ALIASES[u] ?? u;
}

/**
 * レシピの分量文字列(「200g」「1/2個」「大さじ2」など)を数値と単位に分ける。
 * 「適量」「少々」のように量が決まらないものは null を返す。
 */
export function parseAmount(text: string): { value: number; unit: string } | null {
  const s = text.trim();
  if (s === '') return null;
  if (/適量|少々|お好み|ひとつまみ|人数分/.test(s)) return null;

  // 先頭の数値部分(分数・小数・分数記号)と、残りの単位に分ける。
  const match = s.match(/^([\d０-９./\s½⅓⅔¼¾⅛⅜⅝⅞]+)(.*)$/);
  if (!match) return null;

  const value = parseQuantity(match[1]!.replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xfee0)));
  if (value === null || value <= 0) return null;

  return { value, unit: normalizeUnit(match[2] ?? '') };
}

/**
 * 「この料理を作った」ときに在庫から引く量を決める。
 * レシピと在庫の単位が揃っていればその分だけ、揃わなければ常識的な既定値で引く。
 */
export function consumptionAmount(
  recipeQuantity: string,
  stockQuantity: number,
  stockUnit: string,
): number {
  // ざっくり管理のものは「1段階減らす」(たっぷり→半分など)。
  if (isRoughUnit(stockUnit)) {
    const next = ROUGH_LEVELS.find((l) => l.value < stockQuantity);
    return next ? roundQuantity(stockQuantity - next.value) : stockQuantity;
  }

  const amount = parseAmount(recipeQuantity);
  const unit = normalizeUnit(stockUnit);

  // 単位が一致していればレシピの分量をそのまま引く(在庫を超えない)。
  if (amount && amount.unit === unit) {
    return Math.min(stockQuantity, amount.value);
  }

  // 単位が合わない場合は使い切りではなく妥当な量を引く。
  if (isMeasureUnit(unit)) {
    // g・mlは「だいたい半分使った」とみなす(1gだけ引くより実態に近い)。
    return roundQuantity(Math.min(stockQuantity, Math.max(stockQuantity / 2, 1)));
  }
  return Math.min(stockQuantity, 1);
}
