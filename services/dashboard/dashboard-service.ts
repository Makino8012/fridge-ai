import { formatExpiryLabel, getExpiryStatus } from '@/lib/date';
import { listIngredients } from '@/services/ingredients/ingredient-service';
import { suggestWasteReduction } from '@/services/recipes/recipe-service';
import { getAlmostMakeableRecipes, getMakeableRecipes } from '@/services/recipes/local-recipe-service';
import { displayQuantity } from '@/lib/quantity';
import type { RecipeSuggestion } from '@/lib/ai/types';

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

export interface ExpiringItem {
  name: string;
  quantity: string;
  label: string;
}

export interface TonightPicks {
  /** 在庫だけで作れる料理(期限が近い食材を使うものを優先)。 */
  recipes: RecipeSuggestion[];
  /** あと1〜2品買えば作れる料理(在庫だけでは作れないときの控え)。 */
  almost: { missingIngredients: string[]; recipe: RecipeSuggestion }[];
  /** 期限が近い、または切れている食材。 */
  expiring: ExpiringItem[];
}

/**
 * ホーム画面の「今夜これどう?」に出す候補をまとめて用意する。
 * すべてローカルのレシピ辞書で判定するのでAPI料金はかからない。
 */
export async function getTonightPicks(): Promise<TonightPicks> {
  const [ingredients, recipes, almost] = await Promise.all([
    listIngredients({ sort: 'expiry' }),
    getMakeableRecipes(),
    getAlmostMakeableRecipes(),
  ]);

  const expiring = ingredients
    .filter((i) => {
      const status = getExpiryStatus(i.expiry_date);
      return status === 'expired' || status === 'soon';
    })
    .map((i) => ({
      name: i.name,
      quantity: displayQuantity(i.quantity, i.unit),
      label: formatExpiryLabel(i.expiry_date),
    }));

  return { recipes, almost: almost.slice(0, 5), expiring };
}
