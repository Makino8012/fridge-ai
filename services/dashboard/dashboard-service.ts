import { formatExpiryLabel, getExpiryStatus } from '@/lib/date';
import { listIngredients } from '@/services/ingredients/ingredient-service';
import { suggestWasteReduction } from '@/services/recipes/recipe-service';
import { getAlmostMakeableRecipes, getMakeableRecipes } from '@/services/recipes/local-recipe-service';
import { displayQuantity } from '@/lib/quantity';
import { effectiveExpiry } from '@/lib/shelf-life';
import {
  pickStockCheckItems,
  type StockCheckCandidate,
  type StockCheckItem,
} from '@/lib/stock-check';
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
  /** 賞味期限が未入力で、カテゴリから推定した目安であることを示す。 */
  estimated: boolean;
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

  // 期限が未入力の食材も、カテゴリからの目安で拾う。
  // そうしないと期限を入れる習慣がない限り「使い切り」が永久に空になる。
  const expiring = ingredients
    .flatMap((i) => {
      const expiry = effectiveExpiry(i);
      if (!expiry) return [];
      const status = getExpiryStatus(expiry.date);
      if (status !== 'expired' && status !== 'soon') return [];
      return [
        {
          name: i.name,
          quantity: displayQuantity(i.quantity, i.unit),
          label: formatExpiryLabel(expiry.date),
          estimated: expiry.estimated,
        },
      ];
    })
    // 実際に期限が入っている物を先に見せる。目安はその後。
    .sort((a, b) => Number(a.estimated) - Number(b.estimated));

  return { recipes, almost: almost.slice(0, 5), expiring };
}

/**
 * 「これまだある?」と聞きたい食材を数点だけ返す。
 * 在庫データが現実とズレたままだと提案が全部ずれるので、少しずつ直してもらう。
 */
export async function getStockCheckItems(): Promise<StockCheckItem[]> {
  const ingredients = await listIngredients();
  return pickStockCheckItems(ingredients as StockCheckCandidate[]);
}
