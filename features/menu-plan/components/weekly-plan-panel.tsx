'use client';

import { useEffect, useState, useTransition } from 'react';
import { CalendarDays, Check, Dumbbell, Lock, LockOpen, RefreshCw, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { RecipeDetailDialog } from '@/features/recipes/components/recipe-detail-dialog';
import { addMissingToShoppingListAction, buildWeeklyPlanAction } from '@/features/recipes/actions';
import {
  DISHES_PER_MEAL_OPTIONS,
  PLAN_GENRES,
  type PlannedMeal,
} from '@/lib/recipes/weekly-plan';
import { COURSE_LABEL } from '@/lib/recipes/dish-role';
import type { RecipeSuggestion } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

const DAY_LABELS = ['1日目', '2日目', '3日目', '4日目', '5日目', '6日目', '7日目'];
const DAY_OPTIONS = [3, 5, 7];

export function WeeklyPlanPanel({ defaultHighProtein = false }: { defaultHighProtein?: boolean }) {
  const [meals, setMeals] = useState<PlannedMeal[] | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [days, setDays] = useState(7);
  const [highProtein, setHighProtein] = useState(defaultHighProtein);
  const [genres, setGenres] = useState<string[]>([]);
  const [dishesPerMeal, setDishesPerMeal] = useState(3);
  // 気に入った日を固定するための、日付インデックスの集合。
  const [locked, setLocked] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [detail, setDetail] = useState<RecipeSuggestion | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAdding, startAdding] = useTransition();

  function generate(seed = Date.now() % 100000) {
    // 固定した日はそのまま残し、その料理が別の日に重複しないよう除外して作り直す。
    const keep = new Map<number, PlannedMeal>();
    for (const index of locked) {
      const meal = meals?.[index];
      if (meal) keep.set(index, meal);
    }
    const keptTitles = [...keep.values()].flatMap((m) => m.dishes.map((d) => d.recipe.title));

    startTransition(async () => {
      const result = await buildWeeklyPlanAction({
        days,
        highProtein,
        genres,
        dishesPerMeal,
        exclude: keptTitles,
        seed,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const next = result.data.meals.map((meal, index) => keep.get(index) ?? meal);
      setMeals(next);
      setMissing(collectMissing(next));
      setChecked(new Set());
    });
  }

  /** 固定分を混ぜ直したあとの、献立全体で足りない材料。 */
  function collectMissing(all: PlannedMeal[]): string[] {
    return [...new Set(all.flatMap((m) => m.missingIngredients))];
  }

  function toggleLocked(index: number) {
    setLocked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  // 設定を変えたら作り直す。
  useEffect(() => {
    generate(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, highProtein, genres, dishesPerMeal]);

  function toggleGenre(id: string) {
    setGenres((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  function toggleChecked(index: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function addToShoppingList(names: string[], label: string) {
    if (names.length === 0) {
      toast.info('買い足す材料はありません');
      return;
    }
    startAdding(async () => {
      const result = await addMissingToShoppingListAction(names);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${label}の材料${result.data.added}件を買い物リストに追加しました`);
    });
  }

  const checkedMeals = meals?.filter((_, i) => checked.has(i)) ?? [];
  const checkedMissing = [...new Set(checkedMeals.flatMap((m) => m.missingIngredients))];
  const totalProtein = meals?.length
    ? Math.round(
        meals.reduce((sum, meal) => {
          const main = meal.dishes.find((d) => d.course === 'main');
          return sum + (main?.recipe.proteinPerServing ?? 0);
        }, 0) / meals.length,
      )
    : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">日数</span>
          {DAY_OPTIONS.map((d) => (
            <Button
              key={d}
              type="button"
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              className="h-8 rounded-full px-3 text-xs font-normal"
              onClick={() => setDays(d)}
            >
              {d}日
            </Button>
          ))}

          <span className="ml-2 text-xs text-muted-foreground">品数</span>
          {DISHES_PER_MEAL_OPTIONS.map((n) => (
            <Button
              key={n}
              type="button"
              variant={dishesPerMeal === n ? 'default' : 'outline'}
              size="sm"
              className="h-8 rounded-full px-3 text-xs font-normal"
              onClick={() => setDishesPerMeal(n)}
            >
              {n}品
            </Button>
          ))}

          <Button
            type="button"
            variant={highProtein ? 'default' : 'outline'}
            size="sm"
            className="h-8 rounded-full px-3 text-xs font-normal"
            onClick={() => setHighProtein((v) => !v)}
          >
            <Dumbbell className="size-3.5" />
            筋トレ向け
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto h-8 rounded-full px-3 text-xs font-normal"
            onClick={() => generate()}
            disabled={isPending}
          >
            <RefreshCw className={cn('size-3.5', isPending && 'animate-spin')} />
            作り直す
          </Button>
        </div>

        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <Button
            type="button"
            variant={genres.length === 0 ? 'default' : 'outline'}
            size="sm"
            className="h-8 shrink-0 rounded-full px-3 text-xs font-normal"
            onClick={() => setGenres([])}
          >
            すべて
          </Button>
          {PLAN_GENRES.map((g) => (
            <Button
              key={g.id}
              type="button"
              variant={genres.includes(g.id) ? 'default' : 'outline'}
              size="sm"
              className="h-8 shrink-0 rounded-full px-3 text-xs font-normal"
              onClick={() => toggleGenre(g.id)}
            >
              {g.label}
            </Button>
          ))}
        </div>

        {highProtein && meals && meals.length > 0 && (
          <p className="text-xs text-muted-foreground">
            1食あたり平均 <span className="font-semibold text-foreground">タンパク質{totalProtein}g</span>
          </p>
        )}
      </div>

      {isPending && !meals && (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="space-y-2 p-4">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meals && meals.length > 0 && (
        <>
          <div className="space-y-2.5">
            {meals.map((meal, index) => (
              <Card
                key={index}
                className={cn('rounded-2xl', locked.has(index) && 'border-primary/50 bg-accent/30')}
              >
                <CardContent className="space-y-2 p-3.5">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={checked.has(index)}
                      onCheckedChange={() => toggleChecked(index)}
                      className="shrink-0"
                      aria-label={`${DAY_LABELS[index]}を選択`}
                    />
                    <Badge variant="secondary" className="shrink-0 font-normal">
                      {DAY_LABELS[index] ?? `${index + 1}日目`}
                    </Badge>

                    {meal.missingIngredients.length === 0 ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <Check className="size-3.5" />
                        在庫だけで作れる
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        買い足し{meal.missingIngredients.length}品
                      </span>
                    )}

                    {/* 気に入った日は固定して、作り直しても変わらないようにする */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn('ml-auto size-9 shrink-0', locked.has(index) && 'text-primary')}
                      onClick={() => toggleLocked(index)}
                      aria-label={locked.has(index) ? 'この日の固定を解除' : 'この日を固定する'}
                      aria-pressed={locked.has(index)}
                    >
                      {locked.has(index) ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
                    </Button>

                    {meal.missingIngredients.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0"
                        disabled={isAdding}
                        onClick={() =>
                          addToShoppingList(meal.missingIngredients, DAY_LABELS[index] ?? '')
                        }
                        aria-label="この日の材料を買い物リストへ"
                      >
                        <ShoppingCart className="size-4" />
                      </Button>
                    )}
                  </div>

                  <ul className="space-y-1">
                    {meal.dishes.map((dish) => (
                      <li key={dish.recipe.title}>
                        <button
                          type="button"
                          className="flex w-full items-baseline gap-2 text-left"
                          onClick={() => setDetail(dish.recipe)}
                        >
                          <span className="w-8 shrink-0 text-xs text-muted-foreground">
                            {COURSE_LABEL[dish.course]}
                          </span>
                          <span
                            className={cn(
                              'min-w-0 flex-1 truncate',
                              dish.course === 'main'
                                ? 'text-[15px] font-semibold'
                                : 'text-sm text-muted-foreground',
                            )}
                          >
                            {dish.recipe.title}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {dish.recipe.cookingTimeMinutes}分
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {meal.missingIngredients.length > 0 && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      買う物: {meal.missingIngredients.join('、')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* まとめて買い物リストへ */}
          <div className="sticky bottom-20 space-y-2 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur md:bottom-4">
            {checked.size > 0 ? (
              <Button
                className="w-full"
                disabled={isAdding}
                onClick={() => addToShoppingList(checkedMissing, `選んだ${checked.size}食`)}
              >
                {isAdding ? (
                  <LoadingSpinner className="text-primary-foreground" />
                ) : (
                  <>
                    <ShoppingCart className="size-4" />
                    選んだ{checked.size}食の材料を追加（{checkedMissing.length}品）
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={isAdding || missing.length === 0}
                onClick={() => addToShoppingList(missing, '献立全体')}
              >
                {isAdding ? (
                  <LoadingSpinner className="text-primary-foreground" />
                ) : (
                  <>
                    <ShoppingCart className="size-4" />
                    献立全体で足りない{missing.length}品を追加
                  </>
                )}
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">
              左のチェックで食事を選ぶと、その分だけ追加できます
            </p>
          </div>
        </>
      )}

      {meals && meals.length === 0 && !isPending && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
            <CalendarDays className="size-6 text-muted-foreground" />
            <p className="text-sm">献立を作れませんでした</p>
          </CardContent>
        </Card>
      )}

      <RecipeDetailDialog
        recipe={detail}
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
      />
    </div>
  );
}
