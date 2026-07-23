'use client';

import { useEffect, useState, useTransition } from 'react';
import { ChefHat, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import {
  AiLoadingHint,
  RecipeSuggestionCard,
  RecipeSuggestionSkeletonList,
} from '@/features/recipes/components/recipe-suggestion-card';
import { findMakeableRecipesAction, suggestRecipesAction } from '@/features/recipes/actions';
import type { RecipeSuggestion } from '@/lib/ai/types';

export function SuggestRecipesPanel() {
  const [recipes, setRecipes] = useState<RecipeSuggestion[] | null>(null);
  const [isLocalPending, startLocalTransition] = useTransition();
  const [isAiPending, startAiTransition] = useTransition();

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

  function handleAiSuggest() {
    startAiTransition(async () => {
      const result = await suggestRecipesAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRecipes(result.data);
    });
  }

  const isPending = isLocalPending || isAiPending;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleLocalRefresh} disabled={isPending} className="flex-1">
          <RefreshCw className={isLocalPending ? 'animate-spin' : ''} />
          在庫から探す(無料)
        </Button>
        <Button onClick={handleAiSuggest} disabled={isPending} className="flex-1">
          <Sparkles className={isAiPending ? 'animate-pulse' : ''} />
          AIに相談
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        「在庫から探す」はレシピ辞書との照合で料金がかかりません。「AIに相談」は毎回Claudeが考えるため、より自由な提案が得られますが少額の料金がかかります。
      </p>

      {isPending && (
        <div className="space-y-3">
          {isAiPending && <AiLoadingHint />}
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

      {!isPending && recipes && recipes.length === 0 && (
        <EmptyState
          icon={ChefHat}
          title="在庫だけで作れるレシピが見つかりませんでした"
          description="食材を追加するか、「AIに相談」でより柔軟な提案を試せます"
        />
      )}
    </div>
  );
}
