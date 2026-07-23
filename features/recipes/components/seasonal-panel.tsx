'use client';

import { useEffect, useState, useTransition } from 'react';
import { Leaf } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { RecipeSuggestionCard, RecipeSuggestionSkeletonList } from '@/features/recipes/components/recipe-suggestion-card';
import { getSeasonalRecipesAction } from '@/features/recipes/actions';
import { getCurrentSeason, SEASON_LABEL } from '@/lib/date';
import type { RecipeSuggestion } from '@/lib/ai/types';

type SeasonalResult = { missingCount: number; recipe: RecipeSuggestion };

export function SeasonalPanel() {
  const [results, setResults] = useState<SeasonalResult[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const seasonLabel = SEASON_LABEL[getCurrentSeason()];

  useEffect(() => {
    startTransition(async () => {
      const result = await getSeasonalRecipesAction();
      if (result.success) setResults(result.data);
    });
  }, []);

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Leaf className="size-4 text-success" />
        今は「{seasonLabel}」。旬の食材を使ったおすすめレシピです。
      </p>

      {isPending && <RecipeSuggestionSkeletonList />}

      {!isPending && results && results.length > 0 && (
        <div className="space-y-2.5">
          {results.map((r, i) => (
            <div key={i} className="space-y-1.5">
              {r.missingCount === 0 ? (
                <Badge variant="outline" className="border-success/40 font-normal text-success">
                  今の在庫で作れる
                </Badge>
              ) : (
                <Badge variant="outline" className="font-normal">
                  あと{r.missingCount}品で作れる
                </Badge>
              )}
              <RecipeSuggestionCard recipe={r.recipe} />
            </div>
          ))}
        </div>
      )}

      {!isPending && results && results.length === 0 && (
        <EmptyState icon={Leaf} title="旬のレシピが見つかりませんでした" />
      )}
    </div>
  );
}
