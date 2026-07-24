import { createClient } from '@/lib/supabase/server';
import { getAiProvider } from '@/lib/ai/provider';
import type { DietaryPreferencesInput, IngredientInput, MenuPlanTimeframe, RecipeSuggestion } from '@/lib/ai/types';
import { getCurrentHouseholdId, getCurrentProfile } from '@/services/household/household-service';
import { adjustQuantity, listIngredients } from '@/services/ingredients/ingredient-service';
import { namesMatch } from '@/lib/recipes/matcher';
import type { Json } from '@/types/database.types';

async function getIngredientsForAi(): Promise<IngredientInput[]> {
  const ingredients = await listIngredients();
  return ingredients.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    unit: i.unit,
    expiryDate: i.expiry_date,
  }));
}

async function getDietaryPreferencesForAi(): Promise<DietaryPreferencesInput> {
  const profile = await getCurrentProfile();
  const prefs = profile?.dietary_preferences as
    | { allergies?: string[]; dislikes?: string[]; diet?: 'high_protein' | 'low_fat' | null }
    | undefined;

  return {
    allergies: prefs?.allergies ?? [],
    dislikes: prefs?.dislikes ?? [],
    diet: prefs?.diet ?? null,
  };
}

async function recordHistory(
  requestType: 'recipe_suggest' | 'missing_ingredients' | 'menu_plan' | 'shopping_list' | 'waste_reduction',
  requestInput: unknown,
  responseData: unknown,
) {
  const supabase = await createClient();
  const householdId = await getCurrentHouseholdId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from('recipe_history').insert({
    household_id: householdId,
    request_type: requestType,
    request_input: requestInput as Json,
    response_data: responseData as Json,
    requested_by: user?.id ?? null,
  });
}

export async function suggestRecipes() {
  const [ingredients, dietaryPreferences] = await Promise.all([
    getIngredientsForAi(),
    getDietaryPreferencesForAi(),
  ]);

  const result = await getAiProvider().suggestRecipes({ ingredients, dietaryPreferences });
  await recordHistory('recipe_suggest', { ingredients, dietaryPreferences }, result);
  return result.recipes;
}

export async function suggestWithMissingIngredient(missingIngredientName: string) {
  const [ingredients, dietaryPreferences] = await Promise.all([
    getIngredientsForAi(),
    getDietaryPreferencesForAi(),
  ]);

  const input = { ingredients, missingIngredientName, dietaryPreferences };
  const result = await getAiProvider().suggestWithMissingIngredient(input);
  await recordHistory('missing_ingredients', input, result);
  return result.recipes;
}

export async function suggestMenuPlan(timeframe: MenuPlanTimeframe) {
  const [ingredients, dietaryPreferences] = await Promise.all([
    getIngredientsForAi(),
    getDietaryPreferencesForAi(),
  ]);

  const input = { ingredients, dietaryPreferences, timeframe };
  const result = await getAiProvider().suggestMenuPlan(input);
  await recordHistory('menu_plan', input, result);
  return result.plans;
}

export async function suggestWasteReduction() {
  const [ingredients, dietaryPreferences] = await Promise.all([
    getIngredientsForAi(),
    getDietaryPreferencesForAi(),
  ]);

  if (ingredients.every((i) => !i.expiryDate)) return null;

  const input = { ingredients, dietaryPreferences };
  const result = await getAiProvider().suggestWasteReduction(input);
  await recordHistory('waste_reduction', input, result);
  return result;
}

export async function toggleFavorite(recipe: RecipeSuggestion) {
  const supabase = await createClient();
  const householdId = await getCurrentHouseholdId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from('recipe_favorites')
    .select('id')
    .eq('household_id', householdId)
    .eq('title', recipe.title)
    .maybeSingle();

  if (existing) {
    await supabase.from('recipe_favorites').delete().eq('id', existing.id);
    return { favorited: false };
  }

  await supabase.from('recipe_favorites').insert({
    household_id: householdId,
    title: recipe.title,
    recipe_data: recipe as unknown as Json,
    saved_by: user?.id ?? null,
  });
  return { favorited: true };
}

export async function getFavorites() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe_favorites')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getHistory() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

/**
 * 「この料理を作った」: レシピの材料名を在庫と照合し、見つかった食材を1ずつ減らす。
 * 常備調味料など在庫にないものは自動でスキップされる。減らした食材名を返す。
 */
export async function cookRecipe(ingredientNames: string[]): Promise<{ reduced: string[] }> {
  const inventory = await listIngredients();
  const reduced: string[] = [];
  const usedIds = new Set<string>();

  for (const rawName of ingredientNames) {
    const match = inventory.find(
      (item) => !usedIds.has(item.id) && item.quantity > 0 && namesMatch(item.name, rawName),
    );
    if (!match) continue;
    usedIds.add(match.id);
    await adjustQuantity(match.id, -1, 'used_in_recipe');
    reduced.push(match.name);
  }

  return { reduced };
}
