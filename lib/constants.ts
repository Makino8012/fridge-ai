import type { CategoryId, StorageLocationId } from '@/types/database.types';

export const CATEGORY_OPTIONS: { id: CategoryId; label: string }[] = [
  { id: 'vegetable', label: '野菜' },
  { id: 'meat', label: '肉' },
  { id: 'fish', label: '魚' },
  { id: 'drink', label: '飲み物' },
  { id: 'frozen', label: '冷凍食品' },
  { id: 'seasoning', label: '調味料' },
  { id: 'other', label: 'その他' },
];

export const STORAGE_LOCATION_OPTIONS: { id: StorageLocationId; label: string }[] = [
  { id: 'fridge', label: '冷蔵' },
  { id: 'freezer', label: '冷凍' },
  { id: 'room_temp', label: '常温' },
];

export function getCategoryLabel(id: CategoryId): string {
  return CATEGORY_OPTIONS.find((c) => c.id === id)?.label ?? id;
}

export function getStorageLocationLabel(id: StorageLocationId): string {
  return STORAGE_LOCATION_OPTIONS.find((s) => s.id === id)?.label ?? id;
}
