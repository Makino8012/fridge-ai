import { createClient } from '@/lib/supabase/server';
import { getAiProvider } from '@/lib/ai/provider';
import { getCurrentHouseholdId } from '@/services/household/household-service';
import { listIngredients } from '@/services/ingredients/ingredient-service';

export async function listShoppingItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shopping_list_items')
    .select('*')
    .order('is_checked', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addShoppingItem(input: { name: string; quantity?: number | null; unit?: string | null }) {
  const supabase = await createClient();
  const householdId = await getCurrentHouseholdId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert({
      household_id: householdId,
      name: input.name,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addAiSuggestedItems(items: { name: string; quantity: string; unit: string }[]) {
  const supabase = await createClient();
  const householdId = await getCurrentHouseholdId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('shopping_list_items').insert(
    items.map((item) => ({
      household_id: householdId,
      name: item.name,
      unit: item.unit,
      source: 'ai_suggested' as const,
      created_by: user?.id ?? null,
    })),
  );
  if (error) throw error;
}

export async function suggestShoppingListFromAi(desiredRecipeTitles?: string[]) {
  const ingredients = await listIngredients();
  const result = await getAiProvider().suggestShoppingList({
    ingredients: ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      expiryDate: i.expiry_date,
    })),
    desiredRecipeTitles,
  });
  return result.items;
}

export async function toggleChecked(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: current, error: fetchError } = await supabase
    .from('shopping_list_items')
    .select('is_checked')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;

  const nextChecked = !current.is_checked;

  const { error } = await supabase
    .from('shopping_list_items')
    .update({
      is_checked: nextChecked,
      checked_by: nextChecked ? (user?.id ?? null) : null,
      checked_at: nextChecked ? new Date().toISOString() : null,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteShoppingItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);
  if (error) throw error;
}

export async function clearCheckedItems() {
  const supabase = await createClient();
  const householdId = await getCurrentHouseholdId();
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('household_id', householdId)
    .eq('is_checked', true);
  if (error) throw error;
}
