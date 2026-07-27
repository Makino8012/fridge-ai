'use server';

import { revalidatePath } from 'next/cache';
import { actionError, actionSuccess, type ActionResult } from '@/lib/action-result';
import * as recipeService from '@/services/recipes/recipe-service';
import * as localRecipeService from '@/services/recipes/local-recipe-service';
import type { UseUpResult } from '@/lib/recipes/matcher';
import type { PlannedMeal, WeeklyPlanOptions } from '@/lib/recipes/weekly-plan';
import type { BrowseListing } from '@/lib/recipes/matcher';
import * as shoppingListService from '@/services/shopping-list/shopping-list-service';
import { aiErrorMessage, type MenuPlanTimeframe, type RecipeSuggestion } from '@/lib/ai/types';

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
): Promise<ActionResult<{ missingIngredients: string[]; recipe: RecipeSuggestion }[]>> {
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

export async function browseRecipesAction(filters: {
  query?: string;
  tag?: string;
  offset?: number;
}): Promise<ActionResult<BrowseListing>> {
  try {
    const listing = await localRecipeService.getBrowseRecipes(filters);
    return actionSuccess(listing);
  } catch {
    return actionError('レシピ一覧の取得に失敗しました');
  }
}

// ===== AIモード(その都度Claude APIを呼ぶ・課金あり) =====

export async function suggestRecipesAction(): Promise<ActionResult<RecipeSuggestion[]>> {
  try {
    const recipes = await recipeService.suggestRecipes();
    return actionSuccess(recipes);
  } catch (e) {
    return actionError(aiErrorMessage(e, 'レシピ提案の取得に失敗しました。しばらくしてから再度お試しください'));
  }
}

export async function suggestWithMissingIngredientAction(
  missingIngredientName: string,
): Promise<ActionResult<RecipeSuggestion[]>> {
  if (!missingIngredientName.trim()) return actionError('食材名を入力してください');
  try {
    const recipes = await recipeService.suggestWithMissingIngredient(missingIngredientName.trim());
    return actionSuccess(recipes);
  } catch (e) {
    return actionError(aiErrorMessage(e, '提案の取得に失敗しました。しばらくしてから再度お試しください'));
  }
}

export async function suggestMenuPlanAction(
  timeframe: MenuPlanTimeframe,
): Promise<ActionResult<{ mealLabel: string; recipe: RecipeSuggestion }[]>> {
  try {
    const plans = await recipeService.suggestMenuPlan(timeframe);
    return actionSuccess(plans);
  } catch (e) {
    return actionError(aiErrorMessage(e, '献立提案の取得に失敗しました。しばらくしてから再度お試しください'));
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
    // 在庫にある材料だけを対象にする(常備調味料は staple なので除外)。
    const items = recipe.ingredients
      .filter((i) => i.owned && !i.staple)
      .map((i) => ({ name: i.name, quantity: i.quantity }));
    const result = await recipeService.cookRecipe(items);
    revalidatePath('/ingredients');
    revalidatePath('/');
    return actionSuccess(result);
  } catch {
    return actionError('在庫の更新に失敗しました');
  }
}

export async function findUseUpRecipesAction(
  targetNames: string[],
): Promise<ActionResult<UseUpResult[]>> {
  try {
    const recipes = await localRecipeService.getUseUpRecipes(targetNames);
    return actionSuccess(recipes);
  } catch {
    return actionError('レシピの取得に失敗しました');
  }
}

export async function buildWeeklyPlanAction(
  options: WeeklyPlanOptions,
): Promise<ActionResult<{ meals: PlannedMeal[]; missingIngredients: string[] }>> {
  try {
    const result = await localRecipeService.getWeeklyPlan(options);
    return actionSuccess(result);
  } catch {
    return actionError('献立の作成に失敗しました');
  }
}

/** 献立で足りない材料をまとめて買い物リストに入れる。 */
export async function addMissingToShoppingListAction(
  names: string[],
): Promise<ActionResult<{ added: number }>> {
  if (names.length === 0) return actionError('追加する食材がありません');
  try {
    for (const name of names) {
      await shoppingListService.addShoppingItem({ name, quantity: null, unit: null });
    }
    revalidatePath('/shopping-list');
    return actionSuccess({ added: names.length });
  } catch {
    return actionError('買い物リストへの追加に失敗しました');
  }
}
