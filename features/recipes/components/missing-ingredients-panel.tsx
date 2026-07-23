'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { ShoppingBasket } from 'lucide-react';
import {
  AiLoadingHint,
  RecipeSuggestionCard,
  RecipeSuggestionSkeletonList,
} from '@/features/recipes/components/recipe-suggestion-card';
import { suggestWithMissingIngredientAction } from '@/features/recipes/actions';
import type { RecipeSuggestion } from '@/lib/ai/types';

export function MissingIngredientsPanel() {
  const [ingredientName, setIngredientName] = useState('');
  const [recipes, setRecipes] = useState<RecipeSuggestion[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!ingredientName.trim()) {
      toast.error('食材名を入力してください');
      return;
    }
    startTransition(async () => {
      const result = await suggestWithMissingIngredientAction(ingredientName);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRecipes(result.data);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="例: にんじん"
          value={ingredientName}
          onChange={(e) => setIngredientName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button onClick={handleSubmit} disabled={isPending}>
          提案する
        </Button>
      </div>

      {isPending && (
        <div className="space-y-3">
          <AiLoadingHint />
          <RecipeSuggestionSkeletonList />
        </div>
      )}

      {!isPending && recipes && recipes.length > 0 && (
        <div className="space-y-2.5">
          {recipes.map((recipe, i) => (
            <RecipeSuggestionCard key={i} recipe={recipe} />
          ))}
        </div>
      )}

      {!isPending && recipes === null && (
        <EmptyState
          icon={ShoppingBasket}
          title="買い足す食材を入力してください"
          description="「あと1つ買えば作れる」料理を提案します"
        />
      )}

      {!isPending && recipes !== null && recipes.length === 0 && (
        <EmptyState icon={ShoppingBasket} title="該当する料理が見つかりませんでした" />
      )}
    </div>
  );
}
