import recipesData from '@/data/recipes.json';
import { getExpiryStatus } from '@/lib/date';
import {
  findAlmostMakeableRecipes,
  findMakeableRecipes,
  type InventoryItem,
} from '@/lib/recipes/matcher';
import type { LocalRecipe } from '@/lib/recipes/types';
import { listIngredients } from '@/services/ingredients/ingredient-service';

const RECIPES = recipesData as LocalRecipe[];

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
  return findMakeableRecipes(RECIPES, inventory);
}

export async function getAlmostMakeableRecipes(missingIngredientName?: string) {
  const inventory = await getInventory();
  return findAlmostMakeableRecipes(RECIPES, inventory, missingIngredientName);
}
