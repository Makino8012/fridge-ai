import recipesData from '@/data/recipes.json';
import { getCurrentSeason, getExpiryStatus } from '@/lib/date';
import {
  browseRecipes,
  collectTags,
  findAlmostMakeableRecipes,
  evaluateRecipe,
  findMakeableRecipes,
  findRecipesUsing,
  findSeasonalRecipes,
  type BrowseFilters,
  type InventoryItem,
} from '@/lib/recipes/matcher';
import type { LocalRecipe } from '@/lib/recipes/types';
import {
  buildWeeklyPlan,
  collectMissingIngredients,
  type WeeklyPlanOptions,
} from '@/lib/recipes/weekly-plan';
import { listIngredients } from '@/services/ingredients/ingredient-service';

const RECIPES = recipesData as LocalRecipe[];

export const RECIPE_COUNT = RECIPES.length;
export const RECIPE_TAGS = collectTags(RECIPES);

async function getInventory(): Promise<InventoryItem[]> {
  const ingredients = await listIngredients();
  return ingredients.map((i) => {
    const status = getExpiryStatus(i.expiry_date);
    return {
      name: i.name,
      expiringSoon: status === 'soon' || status === 'expired',
    };
  });
}

export async function getMakeableRecipes() {
  const inventory = await getInventory();
  return findMakeableRecipes(RECIPES, inventory, getCurrentSeason());
}

export async function getAlmostMakeableRecipes(missingIngredientName?: string) {
  const inventory = await getInventory();
  return findAlmostMakeableRecipes(RECIPES, inventory, missingIngredientName);
}

export async function getSeasonalRecipes() {
  const inventory = await getInventory();
  return findSeasonalRecipes(RECIPES, inventory, getCurrentSeason());
}

export async function getBrowseRecipes(filters: BrowseFilters) {
  const inventory = await getInventory();
  return browseRecipes(RECIPES, inventory, filters);
}

/** 期限が近い食材などを使い切るためのレシピを探す。 */
export async function getUseUpRecipes(targetNames: string[]) {
  const inventory = await getInventory();
  return findRecipesUsing(RECIPES, inventory, targetNames);
}

/** 1週間分の献立を組み立てる(ローカル辞書のみ・API料金なし)。 */
export async function getWeeklyPlan(options: WeeklyPlanOptions) {
  const inventory = await getInventory();
  const meals = buildWeeklyPlan(RECIPES, inventory, (r) => evaluateRecipe(r, inventory), options);
  return { meals, missingIngredients: collectMissingIngredients(meals) };
}
