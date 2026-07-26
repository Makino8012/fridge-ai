import type { CategoryId } from '@/types/database.types';

/**
 * よく買う食材のカタログ。
 *
 * 肉や野菜は買うたびに名前を打ち直すのが面倒なうえ、
 * 「鶏むね肉」「鶏むね」など表記がぶれてレシピと照合できなくなる。
 * そこで定番はここに固定し、画面では数量だけを増減させる。
 * ここに無いものは今まで通り都度追加する。
 *
 * 名前はレシピ辞書で使われている表記に合わせること。
 * ずれると「在庫にあるのに作れない」が起きる。
 */

export interface StapleFood {
  name: string;
  unit: string;
}

export interface StapleGroup {
  /** グループの見出し。肉の中の「鶏」「豚」のような小分類。 */
  label: string;
  items: StapleFood[];
}

export interface StapleCategory {
  categoryId: CategoryId;
  label: string;
  groups: StapleGroup[];
}

export const STAPLE_CATEGORIES: StapleCategory[] = [
  {
    categoryId: 'meat',
    label: '肉',
    groups: [
      {
        label: '鶏',
        items: [
          { name: '鶏もも肉', unit: '枚' },
          { name: '鶏むね肉', unit: '枚' },
          { name: 'ささみ', unit: '本' },
          { name: '鶏手羽元', unit: '本' },
          { name: '鶏ひき肉', unit: 'g' },
        ],
      },
      {
        label: '豚',
        items: [
          { name: '豚こま肉', unit: 'g' },
          { name: '豚バラ肉', unit: 'g' },
          { name: '豚ロース肉', unit: '枚' },
          { name: '豚ヒレ肉', unit: 'g' },
          { name: '豚ひき肉', unit: 'g' },
        ],
      },
      {
        label: '牛',
        items: [
          { name: '牛こま肉', unit: 'g' },
          { name: '牛バラ肉', unit: 'g' },
          { name: '牛ひき肉', unit: 'g' },
          { name: '合いびき肉', unit: 'g' },
        ],
      },
      {
        label: '加工肉',
        items: [
          { name: 'ベーコン', unit: '枚' },
          { name: 'ウインナー', unit: '本' },
          { name: 'ハム', unit: '枚' },
        ],
      },
    ],
  },
  {
    categoryId: 'vegetable',
    label: '野菜',
    groups: [
      {
        label: '根菜・いも',
        items: [
          { name: '玉ねぎ', unit: '個' },
          { name: 'にんじん', unit: '本' },
          { name: 'じゃがいも', unit: '個' },
          { name: '大根', unit: '本' },
          { name: 'ごぼう', unit: '本' },
          { name: 'れんこん', unit: 'g' },
          { name: 'さつまいも', unit: '本' },
          { name: '里芋', unit: '個' },
          { name: '長芋', unit: 'g' },
        ],
      },
      {
        label: '葉物',
        items: [
          { name: 'キャベツ', unit: '個' },
          { name: '白菜', unit: '個' },
          { name: 'ほうれん草', unit: '束' },
          { name: '小松菜', unit: '束' },
          { name: 'レタス', unit: '個' },
          { name: '水菜', unit: '袋' },
          { name: 'にら', unit: '束' },
          { name: '青梗菜', unit: '株' },
        ],
      },
      {
        label: '果菜',
        items: [
          { name: 'トマト', unit: '個' },
          { name: 'ミニトマト', unit: 'パック' },
          { name: 'なす', unit: '本' },
          { name: 'きゅうり', unit: '本' },
          { name: 'ピーマン', unit: '個' },
          { name: 'パプリカ', unit: '個' },
          { name: 'かぼちゃ', unit: '個' },
          { name: 'ズッキーニ', unit: '本' },
          { name: 'オクラ', unit: '本' },
        ],
      },
      {
        label: 'その他',
        items: [
          { name: 'もやし', unit: '袋' },
          { name: 'ブロッコリー', unit: '株' },
          { name: '長ねぎ', unit: '本' },
          { name: '青ねぎ', unit: '本' },
          { name: 'アスパラガス', unit: '本' },
          { name: 'いんげん', unit: 'g' },
          { name: 'とうもろこし', unit: '本' },
          { name: 'アボカド', unit: '個' },
          { name: '豆苗', unit: '袋' },
        ],
      },
    ],
  },
  {
    categoryId: 'fish',
    label: '魚',
    groups: [
      {
        label: '切り身',
        items: [
          { name: '鮭', unit: '切れ' },
          { name: 'さば', unit: '切れ' },
          { name: 'ぶり', unit: '切れ' },
          { name: 'たら', unit: '切れ' },
          { name: 'かじき', unit: '切れ' },
        ],
      },
      {
        label: '魚介',
        items: [
          { name: 'エビ', unit: 'g' },
          { name: 'イカ', unit: 'g' },
          { name: 'あさり', unit: 'g' },
          { name: 'シーフードミックス', unit: 'g' },
        ],
      },
      {
        label: '缶詰・練り物',
        items: [
          { name: 'ツナ缶', unit: '缶' },
          { name: 'サバ缶', unit: '缶' },
          { name: 'ちくわ', unit: '本' },
          { name: 'しらす', unit: 'g' },
        ],
      },
    ],
  },
  {
    categoryId: 'egg',
    label: '卵',
    groups: [{ label: '卵', items: [{ name: '卵', unit: '個' }] }],
  },
  {
    categoryId: 'dairy',
    label: '乳製品',
    groups: [
      {
        label: '乳製品',
        items: [
          { name: '牛乳', unit: 'ml' },
          { name: 'とろけるチーズ', unit: 'g' },
          { name: 'スライスチーズ', unit: '枚' },
          { name: 'ヨーグルト', unit: 'g' },
          { name: 'バター', unit: 'g' },
        ],
      },
    ],
  },
  {
    categoryId: 'other',
    label: '大豆・きのこ',
    groups: [
      {
        label: '大豆製品',
        items: [
          { name: '豆腐', unit: '丁' },
          { name: '厚揚げ', unit: '枚' },
          { name: '油揚げ', unit: '枚' },
          { name: '納豆', unit: 'パック' },
        ],
      },
      {
        label: 'きのこ',
        items: [
          { name: 'しめじ', unit: 'パック' },
          { name: 'えのき', unit: '袋' },
          { name: 'しいたけ', unit: '枚' },
          { name: 'エリンギ', unit: '本' },
          { name: 'まいたけ', unit: 'パック' },
        ],
      },
    ],
  },
  {
    categoryId: 'grain',
    label: '主食',
    groups: [
      {
        label: '主食',
        items: [
          { name: 'ご飯', unit: '膳' },
          { name: '食パン', unit: '枚' },
          { name: 'うどん', unit: '玉' },
          { name: '中華麺', unit: '玉' },
          { name: 'スパゲッティ', unit: 'g' },
        ],
      },
    ],
  },
];

/** カタログにある食材かどうか(名前は完全一致で判定する)。 */
const STAPLE_NAMES = new Set(
  STAPLE_CATEGORIES.flatMap((c) => c.groups.flatMap((g) => g.items.map((i) => i.name))),
);

export function isStapleFood(name: string): boolean {
  return STAPLE_NAMES.has(name);
}

/** カタログ上の既定単位。登録済みの食材があればそちらの単位を優先すること。 */
export function stapleUnitOf(name: string): string | null {
  for (const category of STAPLE_CATEGORIES) {
    for (const group of category.groups) {
      const found = group.items.find((i) => i.name === name);
      if (found) return found.unit;
    }
  }
  return null;
}

/** 数量を1回の操作でどれだけ動かすか。g や ml は1ずつでは終わらない。 */
export function stepOfUnit(unit: string): number {
  if (unit === 'g') return 50;
  if (unit === 'ml') return 100;
  return 1;
}
