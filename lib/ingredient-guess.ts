import type { CategoryId, StorageLocationId } from '@/types/database.types';

// 食材名からカテゴリー・単位・保存場所を推測して、入力の手間を減らす。
// 完全一致でなく「含む」で判定するので、「とろけるチーズ」→乳製品/その他 のように拾える。

const CATEGORY_KEYWORDS: { category: CategoryId; words: string[] }[] = [
  {
    category: 'meat',
    words: [
      '豚', '牛', '鶏', 'ひき肉', '挽肉', 'ハム', 'ベーコン', 'ウインナー', 'ソーセージ',
      'ささみ', '手羽', 'もも肉', 'むね肉', 'バラ肉', 'ロース', 'レバー', 'サラダチキン',
      'つくね', 'ミンチ', '肉',
    ],
  },
  {
    category: 'fish',
    words: [
      '鮭', 'さけ', 'サーモン', 'さば', 'サバ', 'あじ', 'アジ', 'いわし', 'さんま', 'ぶり',
      'たら', 'カレイ', 'ほっけ', 'まぐろ', 'マグロ', 'かつお', 'えび', 'エビ', 'いか', 'イカ',
      'たこ', 'タコ', 'あさり', 'しじみ', 'ホタテ', '牡蠣', 'かき', 'しらす', 'ちりめん',
      'ちくわ', 'かまぼこ', 'はんぺん', 'さつま揚げ', '明太子', 'たらこ', '魚', '刺身',
    ],
  },
  {
    category: 'drink',
    words: [
      '牛乳', '豆乳', 'ジュース', 'お茶', '緑茶', '麦茶', 'コーヒー', '紅茶', '水', '炭酸',
      'ビール', 'ワイン', '日本酒', '焼酎', 'サイダー', 'コーラ', 'ドリンク', 'スムージー',
    ],
  },
  {
    category: 'frozen',
    words: ['冷凍', 'アイス', '氷'],
  },
  {
    category: 'seasoning',
    words: [
      '醤油', 'しょうゆ', '味噌', 'みそ', '塩', '砂糖', '酢', 'みりん', '酒', '油', 'オイル',
      'ソース', 'ケチャップ', 'マヨネーズ', 'ドレッシング', 'だし', 'コンソメ', '鶏がら',
      'カレー粉', 'こしょう', 'こしょう', '七味', 'わさび', 'からし', 'にんにく', '生姜',
      '片栗粉', '小麦粉', 'パン粉', 'ごま', 'はちみつ', 'ルー', 'めんつゆ', 'ポン酢',
      'オイスター', 'コチュジャン', '豆板醤', 'ナンプラー',
    ],
  },
  {
    category: 'vegetable',
    words: [
      'キャベツ', '白菜', 'レタス', 'ほうれん草', '小松菜', '大根', 'にんじん', '人参',
      '玉ねぎ', 'ねぎ', 'じゃがいも', 'さつまいも', '里芋', '長芋', 'かぼちゃ', 'なす',
      'トマト', 'きゅうり', 'ピーマン', 'パプリカ', 'ブロッコリー', 'アスパラ', 'もやし',
      'きのこ', 'しめじ', 'えのき', 'しいたけ', 'まいたけ', 'エリンギ', 'にら', 'ニラ',
      'ごぼう', 'れんこん', 'かぶ', 'オクラ', 'ズッキーニ', 'とうもろこし', 'コーン',
      '豆苗', '水菜', '春菊', 'セロリ', '大葉', 'みょうが', '枝豆', 'ゴーヤ', '菜の花',
      'たけのこ', 'アボカド', 'いちご', 'りんご', 'バナナ', 'みかん', 'レモン', 'ぶどう',
      '野菜', '果物',
    ],
  },
];

// 卵・豆腐・乳製品などは「その他」に寄せる(専用カテゴリーがないため)。
const OTHER_WORDS = [
  '卵', 'たまご', '豆腐', '納豆', '厚揚げ', '油揚げ', 'チーズ', 'バター', 'ヨーグルト',
  '生クリーム', 'パン', 'ご飯', '米', '麺', 'うどん', 'そば', 'パスタ', '中華麺', '春雨',
  'こんにゃく', 'わかめ', 'のり', 'ひじき', '缶',
];

export function guessCategory(name: string): CategoryId | null {
  const n = name.trim();
  if (n === '') return null;

  // 最も長く一致したキーワードを採用する。
  // 「牛乳」が「牛」(肉)ではなく「牛乳」(飲料)に、「水菜」が「水」ではなく「水菜」に対応する。
  let best: { category: CategoryId; length: number } | null = null;

  const check = (category: CategoryId, words: string[]) => {
    for (const w of words) {
      if (n.includes(w) && (best === null || w.length > best.length)) {
        best = { category, length: w.length };
      }
    }
  };

  check('other', OTHER_WORDS);
  for (const { category, words } of CATEGORY_KEYWORDS) check(category, words);

  return best === null ? null : (best as { category: CategoryId }).category;
}

// g/mlで数えるものは計量単位、それ以外は「個」を初期値にする。
const GRAM_WORDS = [
  '肉', 'ひき肉', '挽肉', 'チーズ', 'バター', 'ごはん', 'ご飯', '米', '粉', 'もやし',
  'ほうれん草', '小松菜', 'えび', 'エビ', 'いか', 'イカ', 'たこ', 'タコ', 'あさり',
  'しらす', 'ひじき', 'わかめ', '春雨', '砂糖', '塩',
];
const ML_WORDS = ['牛乳', '豆乳', 'ジュース', '水', 'お茶', '酒', '油', 'だし', 'ドリンク', '炭酸'];
const PACK_WORDS = ['納豆', '豆腐', '卵'];
const SLICE_WORDS = ['ハム', 'ベーコン', '食パン', 'のり', '油揚げ'];

export function guessUnit(name: string): string | null {
  const n = name.trim();
  if (n === '') return null;
  if (ML_WORDS.some((w) => n.includes(w))) return 'ml';
  if (PACK_WORDS.some((w) => n.includes(w))) return 'パック';
  if (SLICE_WORDS.some((w) => n.includes(w))) return '枚';
  if (GRAM_WORDS.some((w) => n.includes(w))) return 'g';
  return null;
}

export function guessStorage(category: CategoryId | null, name: string): StorageLocationId | null {
  if (name.includes('冷凍') || name.includes('アイス')) return 'freezer';
  if (category === 'frozen') return 'freezer';
  if (category === 'seasoning') return 'room_temp';
  if (category === 'vegetable' || category === 'meat' || category === 'fish' || category === 'drink')
    return 'fridge';
  return null;
}

/** よく使う単位(単位のクイック選択に使う)。「ざっくり」は数えずに管理したいもの用。 */
export const UNIT_PRESETS = ['個', 'g', 'ml', '本', '枚', '袋', 'パック', '束', 'ざっくり'];
