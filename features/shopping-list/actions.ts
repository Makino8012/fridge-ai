'use server';

import { revalidatePath } from 'next/cache';
import { actionError, actionSuccess, type ActionResult } from '@/lib/action-result';
import * as shoppingListService from '@/services/shopping-list/shopping-list-service';
import { addShoppingItemSchema, type AddShoppingItemInput } from './schema';

export async function addShoppingItem(input: AddShoppingItemInput): Promise<ActionResult<null>> {
  const parsed = addShoppingItemSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? 'invalid input');

  try {
    await shoppingListService.addShoppingItem(parsed.data);
    revalidatePath('/shopping-list');
    return actionSuccess(null);
  } catch {
    return actionError('追加に失敗しました');
  }
}

export async function suggestShoppingListAction(): Promise<
  ActionResult<{ name: string; quantity: string; unit: string; reason: string }[]>
> {
  try {
    const items = await shoppingListService.suggestShoppingListFromAi();
    return actionSuccess(items);
  } catch {
    return actionError('提案の取得に失敗しました');
  }
}

export async function importAiSuggestedItems(
  items: { name: string; quantity: string; unit: string }[],
): Promise<ActionResult<null>> {
  try {
    await shoppingListService.addAiSuggestedItems(items);
    revalidatePath('/shopping-list');
    return actionSuccess(null);
  } catch {
    return actionError('追加に失敗しました');
  }
}

export async function toggleChecked(id: string): Promise<ActionResult<null>> {
  try {
    await shoppingListService.toggleChecked(id);
    revalidatePath('/shopping-list');
    return actionSuccess(null);
  } catch {
    return actionError('更新に失敗しました');
  }
}

export async function deleteShoppingItem(id: string): Promise<ActionResult<null>> {
  try {
    await shoppingListService.deleteShoppingItem(id);
    revalidatePath('/shopping-list');
    return actionSuccess(null);
  } catch {
    return actionError('削除に失敗しました');
  }
}

export async function clearCheckedItems(): Promise<ActionResult<null>> {
  try {
    await shoppingListService.clearCheckedItems();
    revalidatePath('/shopping-list');
    return actionSuccess(null);
  } catch {
    return actionError('削除に失敗しました');
  }
}
