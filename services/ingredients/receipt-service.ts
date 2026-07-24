import { getAiProvider } from '@/lib/ai/provider';
import type { ReceiptExtractInput, ReceiptItem } from '@/lib/ai/types';
import { quickAddIngredient } from '@/services/ingredients/ingredient-service';
import type { StorageLocationId } from '@/types/database.types';

export async function extractReceiptItems(input: ReceiptExtractInput): Promise<ReceiptItem[]> {
  const result = await getAiProvider().extractReceiptItems(input);
  return result.items;
}

// カテゴリごとに妥当な保存場所を推定する。
function defaultStorage(categoryId: ReceiptItem['categoryId']): StorageLocationId {
  if (categoryId === 'frozen') return 'freezer';
  if (categoryId === 'seasoning') return 'room_temp';
  return 'fridge';
}

export async function addReceiptItems(items: ReceiptItem[]): Promise<{ added: number }> {
  let added = 0;
  for (const item of items) {
    await quickAddIngredient({
      name: item.name,
      categoryId: item.categoryId,
      storageLocationId: defaultStorage(item.categoryId),
      unit: item.unit,
      quantity: item.quantity,
    });
    added += 1;
  }
  return { added };
}
