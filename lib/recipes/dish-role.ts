import { estimateProteinPerServing } from '@/lib/nutrition';

/**
 * 「その料理だけで一食になるか」を判定する。
 *
 * 献立機能が「3日目: 煮卵」のような副菜を一食として出してしまう問題への対処。
 * レシピ辞書には主菜/副菜のタグが付いている物と付いていない物が混在しているので、
 * タグを優先しつつ、無い場合は中身(タンパク質量と主食の有無)で判断する。
 */

/** これが付いていれば単体で一食になる。 */
const MAIN_TAGS = [
  '主菜',
  '主食',
  '丼',
  '麺',
  'ご飯',
  '米料理',
  'パスタ',
  'カレー',
  '鍋',
  'ラーメン',
  'うどん',
  'そば',
  'グラタン',
  'サンドイッチ',
  'トースト',
  'パン',
  '背徳飯',
];

/** これが付いていれば添え物。単体で献立には出さない。 */
const SIDE_TAGS = [
  '副菜',
  'おつまみ',
  'デザート',
  'おやつ',
  'ドリンク',
  '汁物',
  'サラダ',
  '常備菜',
  '漬物',
];

/** 主食になる食材。これが入っていれば一食として成立しやすい。 */
const STAPLE_CARBS = [
  'ご飯',
  'ごはん',
  '米',
  'パスタ',
  'スパゲッティ',
  'うどん',
  'そば',
  '中華麺',
  'ラーメン',
  '素麺',
  'そうめん',
  'パン',
  '食パン',
  'マカロニ',
  '春雨',
  'ビーフン',
  'フォー',
  '餅',
  'もち',
];

/** タグが無い料理を一食とみなすタンパク質の下限(1人前・g)。 */
const MAIN_PROTEIN_THRESHOLD = 12;

/** 役割が確定するタグ。レシピ追加時はどちらかを必ず付ける。 */
export const ROLE_TAGS = [...MAIN_TAGS, ...SIDE_TAGS];

export type DishRole = 'main' | 'side';

export interface RoleInput {
  ingredients: { name: string; quantity: string; staple: boolean }[];
  tags?: string[];
}

function hasStapleCarb(recipe: RoleInput): boolean {
  return recipe.ingredients.some((ing) =>
    STAPLE_CARBS.some((carb) => ing.name.includes(carb)),
  );
}

/**
 * 主菜(単体で一食)か副菜かを判定する。
 * タグが両方付いている場合は主菜を優先する(「主菜・作り置き」など)。
 */
export function dishRole(recipe: RoleInput): DishRole {
  const tags = recipe.tags ?? [];

  if (tags.some((t) => MAIN_TAGS.includes(t))) return 'main';
  if (tags.some((t) => SIDE_TAGS.includes(t))) return 'side';

  // タグが無い料理は中身で判断する。主食が入っているか、
  // 一食分のタンパク質があれば一食として出してよい。
  if (hasStapleCarb(recipe)) return 'main';
  return estimateProteinPerServing(recipe.ingredients) >= MAIN_PROTEIN_THRESHOLD ? 'main' : 'side';
}

export function isMainDish(recipe: RoleInput): boolean {
  return dishRole(recipe) === 'main';
}

/** 汁物として扱うタグ。 */
const SOUP_TAGS = ['汁物', 'スープ'];

/** 献立の中での立ち位置。主菜・汁物・副菜の3つに分ける。 */
export type DishCourse = 'main' | 'soup' | 'side';

export const COURSE_LABEL: Record<DishCourse, string> = {
  main: '主菜',
  soup: '汁物',
  side: '副菜',
};

/**
 * 一食を組み立てるための分類。
 * 鍋やラーメンのように汁物タグが付いていても単体で一食になる料理は主菜を優先する。
 */
export function dishCourse(recipe: RoleInput): DishCourse {
  if (isMainDish(recipe)) return 'main';
  return (recipe.tags ?? []).some((t) => SOUP_TAGS.includes(t)) ? 'soup' : 'side';
}
