'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import {
  AiLoadingHint,
  RecipeSuggestionCard,
  RecipeSuggestionSkeletonList,
} from '@/features/recipes/components/recipe-suggestion-card';
import { suggestMenuPlanAction } from '@/features/recipes/actions';
import type { MenuPlanTimeframe, RecipeSuggestion } from '@/lib/ai/types';

const TIMEFRAME_OPTIONS: { value: MenuPlanTimeframe; label: string }[] = [
  { value: 'today_dinner', label: '今日の夕食' },
  { value: 'tomorrow_breakfast', label: '明日の朝食' },
  { value: 'this_week', label: '今週の献立' },
];

export function MenuPlanPanel() {
  const [timeframe, setTimeframe] = useState<MenuPlanTimeframe>('today_dinner');
  const [plans, setPlans] = useState<{ mealLabel: string; recipe: RecipeSuggestion }[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFetch() {
    startTransition(async () => {
      const result = await suggestMenuPlanAction(timeframe);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setPlans(result.data);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {TIMEFRAME_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={timeframe === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setTimeframe(opt.value);
              setPlans(null);
            }}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <Button onClick={handleFetch} disabled={isPending} className="w-full">
        献立を提案してもらう
      </Button>

      {isPending && (
        <div className="space-y-3">
          <AiLoadingHint />
          <RecipeSuggestionSkeletonList />
        </div>
      )}

      {!isPending && plans && plans.length > 0 && (
        <div className="space-y-3">
          {plans.map((plan, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">{plan.mealLabel}</p>
              <RecipeSuggestionCard recipe={plan.recipe} />
            </div>
          ))}
        </div>
      )}

      {!isPending && plans === null && (
        <EmptyState icon={CalendarDays} title="期間を選んで献立を提案してもらいましょう" />
      )}
    </div>
  );
}
