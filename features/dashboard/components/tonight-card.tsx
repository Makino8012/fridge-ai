'use client';

import { useState } from 'react';
import { Clock, Flame, RefreshCw, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecipeDetailDialog } from '@/features/recipes/components/recipe-detail-dialog';
import type { TonightPicks } from '@/services/dashboard/dashboard-service';
import type { RecipeSuggestion } from '@/lib/ai/types';

const DIFFICULTY_LABEL: Record<string, string> = { easy: '簡単', normal: '普通', hard: '本格的' };

type Pick = {
  recipe: RecipeSuggestion;
  missing: string[];
};

export function TonightCard({ picks }: { picks: TonightPicks }) {
  // 在庫だけで作れるものを先に、足りなければ「買い足せば作れる」も候補に混ぜる。
  const candidates: Pick[] = [
    ...picks.recipes.map((recipe) => ({ recipe, missing: [] as string[] })),
    ...picks.almost.map((a) => ({ recipe: a.recipe, missing: a.missingIngredients })),
  ];

  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  if (candidates.length === 0) {
    return (
      <Card className="rounded-3xl border-dashed">
        <CardContent className="space-y-2 p-5 text-center">
          <UtensilsCrossed className="mx-auto size-6 text-muted-foreground" />
          <p className="text-sm font-medium">まだ提案できる料理がありません</p>
          <p className="text-xs text-muted-foreground">
            在庫に食材を追加すると、作れる料理を毎日ここに出します
          </p>
        </CardContent>
      </Card>
    );
  }

  const current = candidates[index % candidates.length]!;
  const { recipe, missing } = current;

  return (
    <>
      <Card className="overflow-hidden rounded-3xl border-primary/20 bg-gradient-to-br from-accent/60 to-transparent">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">今夜これどう?</p>
            <span className="text-xs text-muted-foreground">
              {(index % candidates.length) + 1} / {candidates.length}
            </span>
          </div>

          <button
            type="button"
            className="w-full space-y-2 text-left"
            onClick={() => setOpen(true)}
          >
            <p className="text-xl font-bold leading-tight">{recipe.title}</p>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-background/60 font-normal">
                {DIFFICULTY_LABEL[recipe.difficulty]}
              </Badge>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {recipe.cookingTimeMinutes}分
              </span>
              {recipe.usesExpiringIngredient && (
                <span className="flex items-center gap-1 text-warning-foreground dark:text-warning">
                  <Flame className="size-3.5" />
                  期限が近い食材を使える
                </span>
              )}
            </div>

            {missing.length === 0 ? (
              <p className="text-xs text-success">今ある材料だけで作れます</p>
            ) : (
              <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                <ShoppingCart className="size-3.5" />
                {missing.join('、')}を買えば作れます
              </p>
            )}

            <p className="line-clamp-1 text-xs text-muted-foreground">
              {recipe.ingredients.map((i) => i.name).join('、')}
            </p>
          </button>

          <div className="flex gap-2">
            <Button className="flex-1 rounded-full" onClick={() => setOpen(true)}>
              作り方を見る
            </Button>
            <Button
              variant="outline"
              className="rounded-full bg-background/60"
              onClick={() => setIndex((i) => i + 1)}
              disabled={candidates.length <= 1}
            >
              <RefreshCw className="size-4" />
              別の案
            </Button>
          </div>
        </CardContent>
      </Card>

      <RecipeDetailDialog recipe={recipe} open={open} onOpenChange={setOpen} />
    </>
  );
}
