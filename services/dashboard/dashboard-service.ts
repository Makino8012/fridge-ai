import { getExpiryStatus } from '@/lib/date';
import { listIngredients } from '@/services/ingredients/ingredient-service';
import { suggestWasteReduction } from '@/services/recipes/recipe-service';

export interface DashboardSummary {
  totalCount: number;
  expiredCount: number;
  expiringSoonCount: number;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const ingredients = await listIngredients({ sort: 'expiry' });

  let expiredCount = 0;
  let expiringSoonCount = 0;

  for (const ingredient of ingredients) {
    const status = getExpiryStatus(ingredient.expiry_date);
    if (status === 'expired') expiredCount++;
    if (status === 'soon') expiringSoonCount++;
  }

  return {
    totalCount: ingredients.length,
    expiredCount,
    expiringSoonCount,
  };
}

export async function getTodaysSuggestion() {
  return suggestWasteReduction();
}
