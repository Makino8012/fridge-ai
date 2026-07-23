'use client';

import { useState } from 'react';
import { Clock, Flame, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/features/recipes/components/favorite-button';
import { RecipeDetailDialog } from '@/features/recipes/components/recipe-detail-dialog';
import type { RecipeSuggestion } from '@/lib/ai/types';

const DIFFICULTY_LABEL: Record<string, string> = { easy: '簡単', normal: '普通', hard: '本格的' };

export function RecipeSuggestionCard({ recipe }: { recipe: RecipeSuggestion }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="cursor-pointer rounded-2xl transition-colors hover:bg-muted/40" onClick={() => setOpen(true)}>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{recipe.title}</p>
            <FavoriteButton recipe={recipe} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-normal">
              {DIFFICULTY_LABEL[recipe.difficulty]}
            </Badge>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {recipe.cookingTimeMinutes}分
            </span>
            {recipe.usesExpiringIngredient && (
              <span className="flex items-center gap-1 text-warning-foreground dark:text-warning">
                <Flame className="size-3.5" />
                期限が近い食材を使用
              </span>
            )}
          </div>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {recipe.ingredients.map((i) => i.name).join('、')}
          </p>
        </CardContent>
      </Card>
      <RecipeDetailDialog recipe={recipe} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function RecipeSuggestionSkeletonList() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-2xl">
          <CardContent className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AiLoadingHint() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Sparkles className="size-3.5" />
      Claudeがレシピを考えています…
    </p>
  );
}
