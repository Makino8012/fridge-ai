import { describe, expect, it } from 'vitest';
import { recipeSuggestionSchema, suggestRecipesOutputSchema, wasteReductionOutputSchema } from './types';

const validRecipe = {
  title: '肉じゃが',
  difficulty: 'easy' as const,
  cookingTimeMinutes: 30,
  ingredients: [{ name: 'じゃがいも', quantity: '3個', owned: true }],
  steps: ['じゃがいもを切る', '煮込む'],
  usesExpiringIngredient: false,
};

describe('recipeSuggestionSchema', () => {
  it('accepts a well-formed recipe', () => {
    const result = recipeSuggestionSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid difficulty value', () => {
    const result = recipeSuggestionSchema.safeParse({ ...validRecipe, difficulty: 'impossible' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing steps field', () => {
    const { steps: _steps, ...withoutSteps } = validRecipe;
    const result = recipeSuggestionSchema.safeParse(withoutSteps);
    expect(result.success).toBe(false);
  });
});

describe('suggestRecipesOutputSchema', () => {
  it('requires exactly 5 recipes', () => {
    const tooFew = suggestRecipesOutputSchema.safeParse({ recipes: [validRecipe] });
    expect(tooFew.success).toBe(false);

    const exactlyFive = suggestRecipesOutputSchema.safeParse({
      recipes: Array.from({ length: 5 }, () => validRecipe),
    });
    expect(exactlyFive.success).toBe(true);
  });
});

describe('wasteReductionOutputSchema', () => {
  it('accepts a highlighted ingredient with a message and recipe', () => {
    const result = wasteReductionOutputSchema.safeParse({
      highlightedIngredientName: '豆腐',
      message: '豆腐が明日期限なので麻婆豆腐がおすすめです',
      recipe: validRecipe,
    });
    expect(result.success).toBe(true);
  });
});
