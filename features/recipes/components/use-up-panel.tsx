'use client';

import { useEffect, useState, useTransition } from 'react';
import { Leaf, ShoppingCart, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import {
  RecipeSuggestionCard,
  RecipeSuggestionSkeletonList,
} from '@/features/recipes/components/recipe-suggestion-card';
import { findUseUpRecipesAction } from '@/features/recipes/actions';
import { addShoppingItem } from '@/features/shopping-list/actions';
import type { UseUpResult } from '@/lib/recipes/matcher';

export interface UseUpTarget {
  name: string;
  quantity: string;
  label: string;
}

export function UseUpPanel({ targets }: { targets: UseUpTarget[] }) {
  // 最初は期限が近い食材をすべて対象にしておく。
  const [selected, setSelected] = useState<string[]>(() => targets.map((t) => t.name));
  const [results, setResults] = useState<UseUpResult[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [, startAdd] = useTransition();

  useEffect(() => {
    if (selected.length === 0) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const result = await findUseUpRecipesAction(selected);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setResults(result.data);
    });
  }, [selected]);

  function toggle(name: string) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  function addMissingToShoppingList(names: string[]) {
    startAdd(async () => {
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

  if (targets.length === 0) {
    return (
      <EmptyState
        icon={Leaf}
        title="早めに使いたい食材はありません"
        description="賞味期限が近づくと、ここに使い切りのレシピが出ます"
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        期限が近い食材です。使いたいものを選ぶと、それを使うレシピを多く使える順に並べます。
      </p>

      <div className="flex flex-wrap gap-1.5">
        {targets.map((target) => (
          <Button
            key={target.name}
            type="button"
            variant={selected.includes(target.name) ? 'default' : 'outline'}
            size="sm"
            className="h-8 rounded-full px-3 text-xs font-normal"
            onClick={() => toggle(target.name)}
          >
            {target.name}
            <span className="ml-1 opacity-70">{target.label}</span>
          </Button>
        ))}
      </div>

      {isPending && <RecipeSuggestionSkeletonList />}

      {!isPending && results && results.length > 0 && (
        <div className="grid gap-2.5 md:grid-cols-2">
          {results.map((r, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className="font-normal">
                  <Sparkles className="mr-1 size-3" />
                  {r.usedIngredients.length}品を使える
                </Badge>
                {r.usedIngredients.map((name) => (
                  <Badge key={name} variant="secondary" className="font-normal">
                    {name}
                  </Badge>
                ))}
                {r.missingIngredients.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => addMissingToShoppingList(r.missingIngredients)}
                  >
                    <ShoppingCart className="size-3.5" />
                    {r.missingIngredients.join('、')}を買う
                  </Button>
                )}
              </div>
              <RecipeSuggestionCard recipe={r.recipe} />
            </div>
          ))}
        </div>
      )}

      {!isPending && results && results.length === 0 && (
        <EmptyState
          icon={Leaf}
          title={selected.length === 0 ? '食材を選んでください' : '使い切れるレシピが見つかりませんでした'}
        />
      )}
    </div>
  );
}
