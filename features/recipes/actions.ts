'use server';

import { revalidatePath } from 'next/cache';
import { actionError, actionSuccess, type ActionResult } from '@/lib/action-result';
import * as recipeService from '@/services/recipes/recipe-service';
import * as localRecipeService from '@/services/recipes/local-recipe-service';
import type { MenuPlanTimeframe, RecipeSuggestion } from '@/lib/ai/types';

// ===== 無料モード(ローカルレシピ辞書・API課金なし) =====

export async function findMakeableRecipesAction(): Promise<ActionResult<RecipeSuggestion[]>> {
  try {
    const recipes = await localRecipeService.getMakeableRecipes();
    return actionSuccess(recipes);
  } catch {
    return actionError('レシピの取得に失敗しました');
  }
}

export async function findAlmostMakeableAction(
  missingIngredientName?: string,
): Promise<ActionResult<{ missingIngredient: string; recipe: RecipeSuggestion }[]>> {
  try {
    const recipes = await localRecipeService.getAlmostMakeableRecipes(missingIngredientName);
    return actionSuccess(recipes);
  } catch {
    return actionError('レシピの取得に失敗しました');
  }
}

export async function getSeasonalRecipesAction(): Promise<
  ActionResult<{ missingCount: number; recipe: RecipeSuggestion }[]>
> {
  try {
    const recipes = await localRecipeService.getSeasonalRecipes();
    return actionSuccess(recipes);
  } catch {
    return actionError('旬のレシピの取得に失敗しました');
  }
}

// ===== AIモード(その都度Claude APIを呼ぶ・課金あり) =====

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

export async function cookRecipeAction(recipe: RecipeSuggestion): Promise<ActionResult<{ reduced: string[] }>> {
  try {
    // 在庫にある材料(owned)だけを対象にする。常備調味料などは自動でスキップされる。
    const names = recipe.ingredients.filter((i) => i.owned).map((i) => i.name);
    const result = await recipeService.cookRecipe(names);
    revalidatePath('/ingredients');
    revalidatePath('/');
    return actionSuccess(result);
  } catch {
    return actionError('在庫の更新に失敗しました');
  }
}
