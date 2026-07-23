'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ShoppingBasket, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import {
  AiLoadingHint,
  RecipeSuggestionCard,
  RecipeSuggestionSkeletonList,
} from '@/features/recipes/components/recipe-suggestion-card';
import { findAlmostMakeableAction, suggestWithMissingIngredientAction } from '@/features/recipes/actions';
import type { RecipeSuggestion } from '@/lib/ai/types';

type LocalResult = { missingIngredient: string; recipe: RecipeSuggestion };

export function MissingIngredientsPanel() {
  const [ingredientName, setIngredientName] = useState('');
  const [localResults, setLocalResults] = useState<LocalResult[] | null>(null);
  const [aiRecipes, setAiRecipes] = useState<RecipeSuggestion[] | null>(null);
  const [isLocalPending, startLocalTransition] = useTransition();
  const [isAiPending, startAiTransition] = useTransition();

  function handleLocalSearch() {
    setAiRecipes(null);
    startLocalTransition(async () => {
      const result = await findAlmostMakeableAction(ingredientName.trim() || undefined);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setLocalResults(result.data);
    });
  }

  function handleAiSearch() {
    if (!ingredientName.trim()) {
      toast.error('食材名を入力してください');
      return;
    }
    setLocalResults(null);
    startAiTransition(async () => {
      const result = await suggestWithMissingIngredientAction(ingredientName);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setAiRecipes(result.data);
    });
  }

  const isPending = isLocalPending || isAiPending;

  return (
    <div className="space-y-4">
      <Input
        placeholder="買い足す食材(例: にんじん)。空欄なら在庫からあと1品で作れる料理を探します"
        value={ingredientName}
        onChange={(e) => setIngredientName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLocalSearch()}
      />
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleLocalSearch} disabled={isPending} className="flex-1">
          在庫から探す(無料)
        </Button>
        <Button onClick={handleAiSearch} disabled={isPending} className="flex-1">
          <Sparkles className={isAiPending ? 'animate-pulse' : ''} />
          AIに相談
        </Button>
      </div>

      {isPending && (
        <div className="space-y-3">
          {isAiPending && <AiLoadingHint />}
          <RecipeSuggestionSkeletonList />
        </div>
      )}

      {!isPending && localResults && localResults.length > 0 && (
        <div className="space-y-2.5">
          {localResults.map((r, i) => (
            <div key={i} className="space-y-1.5">
              <Badge variant="outline" className="font-normal">
                「{r.missingIngredient}」を買えば作れる
              </Badge>
              <RecipeSuggestionCard recipe={r.recipe} />
            </div>
          ))}
        </div>
      )}

      {!isPending && aiRecipes && aiRecipes.length > 0 && (
        <div className="space-y-2.5">
          {aiRecipes.map((recipe, i) => (
            <RecipeSuggestionCard key={i} recipe={recipe} />
          ))}
        </div>
      )}

      {!isPending && localResults === null && aiRecipes === null && (
        <EmptyState
          icon={ShoppingBasket}
          title="あと1品で作れる料理を探しましょう"
          description="食材名を入れて検索、または空欄のまま「在庫から探す」"
        />
      )}

      {!isPending &&
        ((localResults && localResults.length === 0) || (aiRecipes && aiRecipes.length === 0)) && (
          <EmptyState icon={ShoppingBasket} title="該当する料理が見つかりませんでした" />
        )}
    </div>
  );
}
