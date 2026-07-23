'use server';

import { actionError, actionSuccess, type ActionResult } from '@/lib/action-result';
import * as recipeService from '@/services/recipes/recipe-service';
import type { MenuPlanTimeframe, RecipeSuggestion } from '@/lib/ai/types';

export async function suggestRecipesAction(): Promise<ActionResult<RecipeSuggestion[]>> {
  try {
    const recipes = await recipeService.suggestRecipes();
    return actionSuccess(recipes);
  } catch {
    return actionError('レシピ提案の取得に失敗しました。しばらくしてから再度お試しください');
  }
}

export async function suggestWithMissingIngredientAction(
  missingIngredientName: string,
): Promise<ActionResult<RecipeSuggestion[]>> {
  if (!missingIngredientName.trim()) return actionError('食材名を入力してください');
  try {
    const recipes = await recipeService.suggestWithMissingIngredient(missingIngredientName.trim());
    return actionSuccess(recipes);
  } catch {
    return actionError('提案の取得に失敗しました。しばらくしてから再度お試しください');
  }
}

export async function suggestMenuPlanAction(
  timeframe: MenuPlanTimeframe,
): Promise<ActionResult<{ mealLabel: string; recipe: RecipeSuggestion }[]>> {
  try {
    const plans = await recipeService.suggestMenuPlan(timeframe);
    return actionSuccess(plans);
  } catch {
    return actionError('献立提案の取得に失敗しました。しばらくしてから再度お試しください');
  }
}

export async function toggleFavoriteAction(
  recipe: RecipeSuggestion,
): Promise<ActionResult<{ favorited: boolean }>> {
  try {
    const result = await recipeService.toggleFavorite(recipe);
    return actionSuccess(result);
  } catch {
    return actionError('お気に入りの更新に失敗しました');
  }
}
