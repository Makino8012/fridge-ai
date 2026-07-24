import { createClient } from '@/lib/supabase/server';
import { getCurrentHouseholdId } from '@/services/household/household-service';
import type { CategoryId, IngredientLogReason, StorageLocationId } from '@/types/database.types';

export interface IngredientListParams {
  query?: string;
  categoryId?: CategoryId;
  sort?: 'expiry' | 'name' | 'quantity_asc';
}

export interface CreateIngredientInput {
  name: string;
  quantity: number;
  unit: string;
  categoryId: CategoryId;
  storageLocationId: StorageLocationId;
  expiryDate?: string | null;
  memo?: string | null;
}

export type UpdateIngredientInput = Partial<CreateIngredientInput>;

export async function listIngredients(params: IngredientListParams = {}) {
  const supabase = await createClient();
  let query = supabase.from('ingredients').select('*');

  if (params.query) query = query.ilike('name', `%${params.query}%`);
  if (params.categoryId) query = query.eq('category_id', params.categoryId);

  switch (params.sort) {
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'quantity_asc':
      query = query.order('quantity', { ascending: true });
      break;
    case 'expiry':
    default:
      query = query.order('expiry_date', { ascending: true, nullsFirst: false });
      break;
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getIngredient(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('ingredients').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createIngredient(input: CreateIngredientInput) {
  const supabase = await createClient();
  const householdId = await getCurrentHouseholdId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      household_id: householdId,
      name: input.name,
      quantity: input.quantity,
      unit: input.unit,
      category_id: input.categoryId,
      storage_location_id: input.storageLocationId,
      expiry_date: input.expiryDate ?? null,
      memo: input.memo ?? null,
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateIngredient(id: string, input: UpdateIngredientInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ingredients')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.unit !== undefined && { unit: input.unit }),
      ...(input.categoryId !== undefined && { category_id: input.categoryId }),
      ...(input.storageLocationId !== undefined && { storage_location_id: input.storageLocationId }),
      ...(input.expiryDate !== undefined && { expiry_date: input.expiryDate }),
      ...(input.memo !== undefined && { memo: input.memo }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteIngredient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('ingredients').delete().eq('id', id);
  if (error) throw error;
}

export async function adjustQuantity(id: string, delta: number, reason: IngredientLogReason) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('adjust_ingredient_quantity', {
    p_ingredient_id: id,
    p_delta: delta,
    p_reason: reason,
  });
  if (error) throw error;
  return data;
}

export interface QuickAddInput {
  name: string;
  categoryId: CategoryId;
  storageLocationId: StorageLocationId;
  unit: string;
  quantity: number;
}

/**
 * クイック追加/一括登録用。同名の食材が既にあれば数量を加算し、なければ新規作成する。
 * 戻り値の mode で「加算(incremented)」か「新規(created)」かが分かる。
 */
export async function quickAddIngredient(
  input: QuickAddInput,
): Promise<{ mode: 'created' | 'incremented' }> {
  const supabase = await createClient();
  const householdId = await getCurrentHouseholdId();

  const { data: existing } = await supabase
    .from('ingredients')
    .select('id')
    .eq('household_id', householdId)
    .eq('name', input.name)
    .limit(1)
    .maybeSingle();

  if (existing) {
    await adjustQuantity(existing.id, input.quantity, 'purchased');
    return { mode: 'incremented' };
  }

  await createIngredient({
    name: input.name,
    quantity: input.quantity,
    unit: input.unit,
    categoryId: input.categoryId,
    storageLocationId: input.storageLocationId,
  });
  return { mode: 'created' };
}
