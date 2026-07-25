'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Search, ShoppingBasket, ShoppingCart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import {
  AiLoadingHint,
  RecipeSuggestionCard,
  RecipeSuggestionSkeletonList,
} from '@/features/recipes/components/recipe-suggestion-card';
import {
  findAlmostMakeableAction,
  suggestWithMissingIngredientAction,
} from '@/features/recipes/actions';
import { addShoppingItem } from '@/features/shopping-list/actions';
import type { RecipeSuggestion } from '@/lib/ai/types';

type LocalResult = { missingIngredients: string[]; recipe: RecipeSuggestion };

export function MissingIngredientsPanel() {
  const [ingredientName, setIngredientName] = useState('');
  const [localResults, setLocalResults] = useState<LocalResult[] | null>(null);
  const [aiRecipes, setAiRecipes] = useState<RecipeSuggestion[] | null>(null);
  const [isLocalPending, startLocalTransition] = useTransition();
  const [isAiPending, startAiTransition] = useTransition();
  const [, startAddTransition] = useTransition();

  function runLocalSearch(query?: string) {
    setAiRecipes(null);
    startLocalTransition(async () => {
      const result = await findAlmostMakeableAction(query?.trim() || undefined);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setLocalResults(result.data);
    });
  }

  // タブを開いた時点で「買い足せば作れる料理」を自動で表示する(無料・API不要)。
  useEffect(() => {
    runLocalSearch();
  }, []);

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

  function addAllToShoppingList(names: string[]) {
    startAddTransition(async () => {
      for (const name of names) {
        const result = await addShoppingItem({ name, quantity: null, unit: null });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
      }
      toast.success(`${names.join('、')}を買い物リストに追加しました`);
    });
  }

  const isPending = isLocalPending || isAiPending;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        今の在庫にあと1〜2品買い足すだけで作れる料理です。足りない食材はそのまま買い物リストに追加できます。
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="買う予定の食材で絞り込む(例: にんじん)"
          value={ingredientName}
          onChange={(e) => setIngredientName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runLocalSearch(ingredientName)}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => runLocalSearch(ingredientName)}
          disabled={isPending}
          className="flex-1"
        >
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
        <div className="grid gap-2.5 md:grid-cols-2">
          {localResults.map((r, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="font-normal">
                  買い足す{r.missingIngredients.length}品
                </Badge>
                {r.missingIngredients.map((name) => (
                  <Badge key={name} variant="secondary" className="font-normal">
                    {name}
                  </Badge>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => addAllToShoppingList(r.missingIngredients)}
                >
                  <ShoppingCart className="size-3.5" /> 買い物リストへ
                </Button>
              </div>
              <RecipeSuggestionCard recipe={r.recipe} />
            </div>
          ))}
        </div>
      )}

      {!isPending && aiRecipes && aiRecipes.length > 0 && (
        <div className="grid gap-2.5 md:grid-cols-2">
          {aiRecipes.map((recipe, i) => (
            <RecipeSuggestionCard key={i} recipe={recipe} />
          ))}
        </div>
      )}

      {!isPending &&
        ((localResults && localResults.length === 0) || (aiRecipes && aiRecipes.length === 0)) && (
          <EmptyState
            icon={ShoppingBasket}
            title="該当する料理が見つかりませんでした"
            description="食材を登録するか、絞り込みの食材名を変えてみてください"
          />
        )}
    </div>
  );
}
