import type { CategoryId, StorageLocationId } from '@/types/database.types';

export interface QuickAddPreset {
  name: string;
  categoryId: CategoryId;
  storageLocationId: StorageLocationId;
  unit: string;
  defaultQuantity: number;
}

// よく使う定番食材。タップで即追加できる。数量・単位・カテゴリはここのデフォルトを使う。
export const QUICK_ADD_PRESETS: QuickAddPreset[] = [
  { name: '卵', categoryId: 'other', storageLocationId: 'fridge', unit: '個', defaultQuantity: 10 },
  { name: '牛乳', categoryId: 'drink', storageLocationId: 'fridge', unit: '本', defaultQuantity: 1 },
  { name: '玉ねぎ', categoryId: 'vegetable', storageLocationId: 'room_temp', unit: '個', defaultQuantity: 3 },
  { name: 'にんじん', categoryId: 'vegetable', storageLocationId: 'fridge', unit: '本', defaultQuantity: 2 },
  { name: 'じゃがいも', categoryId: 'vegetable', storageLocationId: 'room_temp', unit: '個', defaultQuantity: 3 },
  { name: 'キャベツ', categoryId: 'vegetable', storageLocationId: 'fridge', unit: '個', defaultQuantity: 1 },
  { name: 'トマト', categoryId: 'vegetable', storageLocationId: 'fridge', unit: '個', defaultQuantity: 3 },
  { name: 'ピーマン', categoryId: 'vegetable', storageLocationId: 'fridge', unit: '個', defaultQuantity: 4 },
  { name: 'もやし', categoryId: 'vegetable', storageLocationId: 'fridge', unit: '袋', defaultQuantity: 1 },
  { name: '長ねぎ', categoryId: 'vegetable', storageLocationId: 'fridge', unit: '本', defaultQuantity: 2 },
  { name: '豚こま肉', categoryId: 'meat', storageLocationId: 'fridge', unit: 'g', defaultQuantity: 300 },
  { name: '鶏もも肉', categoryId: 'meat', storageLocationId: 'fridge', unit: '枚', defaultQuantity: 2 },
  { name: '合いびき肉', categoryId: 'meat', storageLocationId: 'fridge', unit: 'g', defaultQuantity: 300 },
  { name: 'ベーコン', categoryId: 'meat', storageLocationId: 'fridge', unit: 'パック', defaultQuantity: 1 },
  { name: 'ウインナー', categoryId: 'meat', storageLocationId: 'fridge', unit: '袋', defaultQuantity: 1 },
  { name: '鮭', categoryId: 'fish', storageLocationId: 'fridge', unit: '切れ', defaultQuantity: 2 },
  { name: '豆腐', categoryId: 'other', storageLocationId: 'fridge', unit: '丁', defaultQuantity: 1 },
  { name: '納豆', categoryId: 'other', storageLocationId: 'fridge', unit: 'パック', defaultQuantity: 3 },
  { name: 'ヨーグルト', categoryId: 'other', storageLocationId: 'fridge', unit: '個', defaultQuantity: 1 },
  { name: '米', categoryId: 'other', storageLocationId: 'room_temp', unit: 'kg', defaultQuantity: 5 },
];
