'use client';

import { useEffect, useState, useTransition } from 'react';
import { ChefHat, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import {
  RecipeSuggestionCard,
  RecipeSuggestionSkeletonList,
} from '@/features/recipes/components/recipe-suggestion-card';
import { findMakeableRecipesAction } from '@/features/recipes/actions';
import type { RecipeSuggestion } from '@/lib/ai/types';

export function SuggestRecipesPanel() {
  const [recipes, setRecipes] = useState<RecipeSuggestion[] | null>(null);
  const [isLocalPending, startLocalTransition] = useTransition();

  // 無料モード(ローカル辞書)を初回に自動実行。API課金は発生しない。
  useEffect(() => {
    startLocalTransition(async () => {
      const result = await findMakeableRecipesAction();
      if (result.success) setRecipes(result.data);
    });
  }, []);

  function handleLocalRefresh() {
    startLocalTransition(async () => {
      const result = await findMakeableRecipesAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRecipes(result.data);
    });
  }

  const isPending = isLocalPending;

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={handleLocalRefresh} disabled={isPending} className="w-full">
        <RefreshCw className={isLocalPending ? 'animate-spin' : ''} />
        在庫から探し直す
      </Button>

      {isPending && (
        <RecipeSuggestionSkeletonList />
      )}

      {!isPending && recipes && recipes.length > 0 && (
        <div className="grid gap-2.5 md:grid-cols-2">
          {recipes.map((recipe, i) => (
            <RecipeSuggestionCard key={i} recipe={recipe} />
          ))}
        </div>
      )}

      {!isPending && recipes && recipes.length === 0 && (
        <EmptyState
          icon={ChefHat}
          title="在庫だけで作れるレシピが見つかりませんでした"
          description="食材を追加するか、「買い足せば作れる」から探してみてください"
        />
      )}
    </div>
  );
}
