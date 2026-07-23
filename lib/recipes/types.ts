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
}
