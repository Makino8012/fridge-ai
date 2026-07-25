export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all';

export interface LocalRecipeIngredient {
  name: string;
  quantity: string;
  staple: boolean;
}

export interface LocalRecipe {
  title: string;
  difficulty: 'easy' | 'normal' | 'hard';
  cookingTimeMinutes: number;
  ingredients: LocalRecipeIngredient[];
  steps: string[];
  tags: string[];
  seasons: Season[];
  /**
   * 1人分のタンパク質量(g)。レシピ提供元に数値がある場合だけ入る。
   * 無い場合は材料から自動で見積もる(lib/nutrition.ts)。
   */
  proteinPerServing?: number;
}
