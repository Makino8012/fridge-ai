'use client';

import { useState, useTransition } from 'react';
import { ChefHat, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import {
  AiLoadingHint,
  RecipeSuggestionCard,
  RecipeSuggestionSkeletonList,
} from '@/features/recipes/components/recipe-suggestion-card';
import { suggestRecipesAction } from '@/features/recipes/actions';
import type { RecipeSuggestion } from '@/lib/ai/types';

export function SuggestRecipesPanel() {
  const [recipes, setRecipes] = useState<RecipeSuggestion[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFetch() {
    startTransition(async () => {
      const result = await suggestRecipesAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRecipes(result.data);
    });
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleFetch} disabled={isPending} className="w-full">
        <RefreshCw className={isPending ? 'animate-spin' : ''} />
        {recipes ? '別の提案をもらう' : '今ある食材で作れる料理を提案してもらう'}
      </Button>

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
          icon={ChefHat}
          title="まだ提案がありません"
          description="ボタンを押すと在庫からAIがレシピを5件提案します"
        />
      )}
    </div>
  );
}
