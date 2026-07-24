import recipesData from '@/data/recipes.json';
import { getCurrentSeason, getExpiryStatus } from '@/lib/date';
import {
  browseRecipes,
  collectTags,
  findAlmostMakeableRecipes,
  findMakeableRecipes,
  findSeasonalRecipes,
  type BrowseFilters,
  type InventoryItem,
} from '@/lib/recipes/matcher';
import type { LocalRecipe } from '@/lib/recipes/types';
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
