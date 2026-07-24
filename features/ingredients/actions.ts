'use server';

import { revalidatePath } from 'next/cache';
import { actionError, actionSuccess, type ActionResult } from '@/lib/action-result';
import * as ingredientService from '@/services/ingredients/ingredient-service';
import { lookupBarcode, type BarcodeLookupResult } from '@/services/ingredients/barcode-service';
import type { IngredientLogReason, IngredientSource } from '@/types/database.types';
import {
  createIngredientSchema,
  updateIngredientSchema,
  type IngredientFormInput,
  type UpdateIngredientFormInput,
} from './schema';

export async function createIngredient(
  input: IngredientFormInput,
  extra?: { source?: IngredientSource; barcode?: string | null },
): Promise<ActionResult<null>> {
  const parsed = createIngredientSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? 'invalid input');

  try {
    await ingredientService.createIngredient({
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      categoryId: parsed.data.categoryId,
      storageLocationId: parsed.data.storageLocationId,
      expiryDate: parsed.data.expiryDate,
      memo: parsed.data.memo,
      source: extra?.source,
      barcode: extra?.barcode ?? null,
    });
    revalidatePath('/ingredients');
    revalidatePath('/');
    return actionSuccess(null);
  } catch {
    return actionError('食材の登録に失敗しました');
  }
}

export async function updateIngredient(input: UpdateIngredientFormInput): Promise<ActionResult<null>> {
  const parsed = updateIngredientSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? 'invalid input');

  try {
    const { id, ...rest } = parsed.data;
    await ingredientService.updateIngredient(id, rest);
    revalidatePath('/ingredients');
    revalidatePath('/');
    return actionSuccess(null);
  } catch {
    return actionError('食材の更新に失敗しました');
  }
}

export async function deleteIngredient(id: string): Promise<ActionResult<null>> {
  try {
    await ingredientService.deleteIngredient(id);
    revalidatePath('/ingredients');
    revalidatePath('/');
    return actionSuccess(null);
  } catch {
    return actionError('食材の削除に失敗しました');
  }
}

export async function adjustQuantity(
  id: string,
  delta: number,
  reason: IngredientLogReason = 'manual_adjust',
): Promise<ActionResult<{ quantity: number }>> {
  try {
    const quantity = await ingredientService.adjustQuantity(id, delta, reason);
    revalidatePath('/ingredients');
    revalidatePath('/');
    return actionSuccess({ quantity });
  } catch {
    return actionError('数量の更新に失敗しました');
  }
}

export async function quickAddIngredient(
  input: ingredientService.QuickAddInput,
): Promise<ActionResult<{ mode: 'created' | 'incremented' }>> {
  try {
    const result = await ingredientService.quickAddIngredient(input);
    revalidatePath('/ingredients');
    revalidatePath('/');
    return actionSuccess(result);
  } catch {
    return actionError('追加に失敗しました');
  }
}

export async function lookupBarcodeAction(barcode: string): Promise<ActionResult<BarcodeLookupResult>> {
  try {
    const result = await lookupBarcode(barcode);
    return actionSuccess(result);
  } catch {
    return actionError('商品情報の照会に失敗しました');
  }
}
