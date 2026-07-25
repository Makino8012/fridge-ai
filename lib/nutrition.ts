import { parseAmount } from '@/lib/quantity';

/**
 * レシピのタンパク質量をざっくり見積もる。
 * 正確な栄養計算ではなく「筋トレ向きか」を判断するための目安。
 */

// 食材100gあたりのタンパク質(g)。長い名前から先に照合する。
const PROTEIN_PER_100G: [string, number][] = [
  ['鶏むね肉', 23], ['鶏ささみ', 23], ['ささみ', 23], ['鶏もも肉', 17], ['手羽元', 18],
  ['手羽先', 17], ['鶏ひき肉', 20], ['サラダチキン', 23], ['鶏レバー', 18], ['鶏肉', 20],
  ['豚ヒレ肉', 22], ['豚ロース', 19], ['豚こま肉', 18], ['豚バラ肉', 14], ['豚ひき肉', 18],
  ['豚薄切り肉', 18], ['豚肉', 18], ['スペアリブ', 17],
  ['牛すじ', 28], ['牛こま肉', 19], ['牛ひき肉', 19], ['牛薄切り肉', 19], ['牛カルビ', 15],
  ['牛もも肉', 21], ['牛肉', 19], ['合いびき肉', 18], ['ひき肉', 18],
  ['ハム', 17], ['ベーコン', 13], ['ウインナー', 13], ['ソーセージ', 13], ['チャーシュー', 19],
  ['生ハム', 24], ['コンビーフ', 20], ['スパム', 14],
  ['まぐろ', 26], ['かつお', 25], ['鮭', 22], ['サーモン', 20], ['さば', 21], ['ぶり', 21],
  ['あじ', 20], ['いわし', 19], ['さんま', 18], ['たら', 18], ['カレイ', 20], ['銀だら', 14],
  ['白身魚', 19], ['さわら', 20], ['ししゃも', 21], ['明太子', 21], ['たらこ', 24],
  ['しらす', 15], ['ちりめんじゃこ', 40], ['エビ', 19], ['イカ', 18], ['たこ', 16],
  ['ホタテ', 14], ['あさり', 6], ['しじみ', 7], ['牡蠣', 7], ['カニカマ', 12],
  ['ちくわ', 12], ['かまぼこ', 12], ['はんぺん', 10], ['さつま揚げ', 13], ['ツナ缶', 18],
  ['サバ缶', 21], ['焼き鳥缶', 16],
  ['卵', 12], ['うずら卵', 13], ['卵黄', 16],
  ['チーズ', 23], ['モッツァレラ', 18], ['クリームチーズ', 8], ['粉チーズ', 44],
  ['ヨーグルト', 4], ['牛乳', 3], ['豆乳', 4], ['生クリーム', 2],
  ['納豆', 17], ['豆腐', 7], ['木綿豆腐', 7], ['絹豆腐', 5], ['厚揚げ', 11], ['油揚げ', 23],
  ['がんもどき', 15], ['大豆', 15], ['ミックスビーンズ', 8], ['ひよこ豆', 9], ['おから', 6],
  ['枝豆', 12],
  ['プロテインパウダー', 80], ['きなこ', 36], ['すりごま', 20], ['ごま', 20],
  ['オートミール', 14], ['そば', 5], ['パスタ', 5], ['中華麺', 5], ['うどん', 3],
  ['ご飯', 3], ['米', 6], ['食パン', 9],
];

// 個・枚などで書かれた材料のおおよその重さ(g)。
const UNIT_WEIGHT: Record<string, number> = {
  個: 60, 本: 80, 枚: 20, 丁: 300, パック: 100, 束: 150, 袋: 200, 尾: 80, 切れ: 80, 杯: 200,
};

const SPECIFIC_WEIGHT: [string, number][] = [
  ['卵', 50], ['うずら卵', 10], ['食パン', 60], ['ハム', 15], ['ベーコン', 17],
  ['ウインナー', 20], ['油揚げ', 30], ['厚揚げ', 150], ['ちくわ', 30],
  ['納豆', 45], ['豆腐', 300], ['チャーシュー', 20], ['餅', 50],
  // 缶詰は「1缶」と書かれることが多いので、中身の重さを個別に持つ。
  ['サバ缶', 190], ['ツナ缶', 70], ['焼き鳥缶', 75], ['コーン缶', 190],
  ['トマト缶', 400], ['ミックスビーンズ', 100], ['ひよこ豆', 100],
  ['ささみ', 45], ['手羽元', 60], ['手羽先', 50], ['ししゃも', 20],
];

function proteinRate(name: string): number | null {
  let best: { rate: number; length: number } | null = null;
  for (const [word, rate] of PROTEIN_PER_100G) {
    if (name.includes(word) && (best === null || word.length > best.length)) {
      best = { rate, length: word.length };
    }
  }
  return best?.rate ?? null;
}

function gramsOf(name: string, quantity: string): number | null {
  const amount = parseAmount(quantity);
  if (!amount) return null;

  if (amount.unit === 'g') return amount.value;
  if (amount.unit === 'kg') return amount.value * 1000;
  if (amount.unit === 'ml') return amount.value; // 液体はほぼ同量とみなす

  // 「1個」「2枚」などは、食材ごとの目安の重さを掛ける。
  for (const [word, weight] of SPECIFIC_WEIGHT) {
    if (name.includes(word)) return amount.value * weight;
  }
  const unitWeight = UNIT_WEIGHT[amount.unit];
  return unitWeight ? amount.value * unitWeight : null;
}

export interface ProteinSource {
  name: string;
  grams: number;
}

/**
 * 1人分のタンパク質量(g)を見積もる。レシピは2人前が基本。
 * 分量が「適量」などで量れない材料は無視する。
 */
export function estimateProteinPerServing(
  ingredients: { name: string; quantity: string; staple: boolean }[],
  servings = 2,
): number {
  let total = 0;
  for (const ing of ingredients) {
    if (ing.staple) continue; // 調味料は数えない
    const rate = proteinRate(ing.name);
    if (rate === null) continue;
    const grams = gramsOf(ing.name, ing.quantity);
    if (grams === null) continue;
    total += (grams * rate) / 100;
  }
  return Math.round(total / servings);
}

/** 筋トレ向きとみなすタンパク質量(1人分)。 */
export const HIGH_PROTEIN_THRESHOLD = 25;

export function isHighProtein(proteinPerServing: number): boolean {
  return proteinPerServing >= HIGH_PROTEIN_THRESHOLD;
}
