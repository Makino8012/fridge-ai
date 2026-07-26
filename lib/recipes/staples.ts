/**
 * レシピ辞書の staple フラグは「常備調味料」を意味し、在庫照合をせず
 * 持っている前提で扱われる。しかしその中身にはオイスターソースやナンプラー、
 * さらには生のにんにく・生姜まで含まれていて、
 * 「常備扱いなのに家に全然無い」材料が出てしまっていた。
 *
 * そこで staple を2段階に分ける。
 * ・基礎調味料 … どの家庭にもある前提でよい。在庫照合しない
 * ・それ以外   … 家庭によって無い。ふつうの材料として在庫照合する
 *
 * 判断に迷うものは「照合する」側に倒す。
 * 無い物を持っている事にして提案が外れるより、買い物リストに出る方がましなため。
 */

/**
 * 在庫照合をしない基礎調味料。
 * 「まず切らさない」「切らしても献立の判断には影響しない」ものだけを入れる。
 */
const BASIC_STAPLES = [
  // 基本の調味料
  '塩',
  '砂糖',
  '醤油',
  '味噌',
  '酢',
  'みりん',
  '酒',
  '料理酒',
  'こしょう',
  '黒こしょう',
  '塩こしょう',
  // 油
  'サラダ油',
  '油',
  'ごま油',
  'オリーブオイル',
  'バター',
  // 粉
  '小麦粉',
  '薄力粉',
  '片栗粉',
  '水溶き片栗粉',
  // 定番の卓上調味料
  'マヨネーズ',
  'カロリーハーフマヨネーズ',
  'ケチャップ',
  // だし・水
  'だし',
  '水',
  'お湯',
];

/** 表記ゆれをそろえる(全角/半角、大小、記号、送りがな)。 */
function normalize(name: string): string {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s　()（）]/g, '')
    .trim();
}

const BASIC_STAPLE_SET = new Set(BASIC_STAPLES.map(normalize));

/**
 * 在庫を確認せず「持っている前提」にしてよい基礎調味料かどうか。
 *
 * 「醤油(小さじ2)」のように補足が付く場合があるので、
 * 括弧を落とした前方一致も見る。
 */
export function isBasicStaple(ingredientName: string): boolean {
  const name = normalize(ingredientName);
  if (BASIC_STAPLE_SET.has(name)) return true;
  // 「めんつゆ(3倍濃縮)」のような表記に備えて、括弧の前で切って再判定する。
  const head = name.split(/[(（]/)[0];
  return head !== undefined && head !== name && BASIC_STAPLE_SET.has(head);
}

export { BASIC_STAPLES };
