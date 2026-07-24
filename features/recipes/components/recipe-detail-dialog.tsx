'use client';

import { useEffect, useState, useTransition } from 'react';
import { Check, CircleDot, CookingPot, Minus, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { FavoriteButton } from '@/features/recipes/components/favorite-button';
import { cookRecipeAction } from '@/features/recipes/actions';
import { BASE_SERVINGS, scaleQuantity, servingsRatio } from '@/lib/recipes/scale';
import type { RecipeSuggestion } from '@/lib/ai/types';

const DIFFICULTY_LABEL: Record<string, string> = { easy: '簡単', normal: '普通', hard: '本格的' };
const MIN_SERVINGS = 1;
const MAX_SERVINGS = 8;

export function RecipeDetailDialog({
  recipe,
  open,
  onOpenChange,
}: {
  recipe: RecipeSuggestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isCooking, startCooking] = useTransition();
  const [servings, setServings] = useState(BASE_SERVINGS);

  // ダイアログを開くたびに基本(2人前)に戻す。
  useEffect(() => {
    if (open) setServings(BASE_SERVINGS);
  }, [open]);

  function handleCooked() {
    if (!recipe) return;
    startCooking(async () => {
      const result = await cookRecipeAction(recipe);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.data.reduced.length === 0) {
        toast.info('在庫から減らせる材料はありませんでした');
      } else {
        toast.success(`${result.data.reduced.join('、')}を在庫から1つずつ減らしました`);
      }
      onOpenChange(false);
    });
  }

  if (!recipe) return null;

  // 在庫から減らせるのは「実際に在庫にある食材(常備調味料以外)」だけ。
  const hasOwned = recipe.ingredients.some((i) => i.owned && !i.staple);
  const ratio = servingsRatio(servings);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2 pr-6">
            <DialogTitle>{recipe.title}</DialogTitle>
            <FavoriteButton recipe={recipe} />
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-normal">
            難易度: {DIFFICULTY_LABEL[recipe.difficulty]}
          </Badge>
          <Badge variant="outline" className="font-normal">
            調理時間: {recipe.cookingTimeMinutes}分
          </Badge>
        </div>

        <div className="flex items-center justify-between rounded-xl border px-3 py-2">
          <span className="text-sm font-medium">分量</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-full"
              disabled={servings <= MIN_SERVINGS}
              onClick={() => setServings((s) => Math.max(MIN_SERVINGS, s - 1))}
              aria-label="人数を減らす"
            >
              <Minus className="size-4" />
            </Button>
            <span className="min-w-14 text-center text-sm font-medium tabular-nums">{servings}人前</span>
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-full"
              disabled={servings >= MAX_SERVINGS}
              onClick={() => setServings((s) => Math.min(MAX_SERVINGS, s + 1))}
              aria-label="人数を増やす"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">必要な材料（{servings}人前）</h3>
          <ul className="space-y-1 text-sm">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-2">
                {ing.owned && !ing.staple ? (
                  <Check className="size-4 shrink-0 text-success" />
                ) : ing.staple ? (
                  <CircleDot className="size-4 shrink-0 text-muted-foreground/60" />
                ) : (
                  <X className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className={!ing.owned || ing.staple ? 'text-muted-foreground' : ''}>
                  {ing.name} {scaleQuantity(ing.quantity, ratio)}
                </span>
                {ing.staple && (
                  <Badge variant="outline" className="ml-auto shrink-0 px-1.5 py-0 text-[10px] font-normal">
                    常備
                  </Badge>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            <Check className="mr-1 inline size-3 text-success" />在庫にある
            <span className="mx-1.5">/</span>
            <CircleDot className="mr-1 inline size-3 text-muted-foreground/60" />常備（調味料など、持っている前提）
            <span className="mx-1.5">/</span>
            <X className="mr-1 inline size-3" />不足
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">作り方</h3>
          <ol className="space-y-2 text-sm">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 font-medium text-muted-foreground">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {hasOwned && (
          <div className="space-y-1.5 border-t pt-4">
            <Button className="w-full" onClick={handleCooked} disabled={isCooking}>
              {isCooking ? (
                <LoadingSpinner className="text-primary-foreground" />
              ) : (
                <>
                  <CookingPot className="size-4" /> この料理を作った（在庫を減らす）
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              在庫にある材料を1つずつ減らします。常備調味料は対象外です。
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
