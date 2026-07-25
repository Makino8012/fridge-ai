'use client';

import { useState } from 'react';
import { CalendarDays, ChefHat, Leaf, ShoppingBasket, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SuggestRecipesPanel } from '@/features/recipes/components/suggest-recipes-panel';
import { SeasonalPanel } from '@/features/recipes/components/seasonal-panel';
import { MissingIngredientsPanel } from '@/features/recipes/components/missing-ingredients-panel';
import { UseUpPanel, type UseUpTarget } from '@/features/recipes/components/use-up-panel';
import { WeeklyPlanPanel } from '@/features/menu-plan/components/weekly-plan-panel';

type Mode = 'makeable' | 'useup' | 'seasonal' | 'missing' | 'weekly';

const MODES: { id: Mode; label: string; icon: typeof ChefHat }[] = [
  { id: 'makeable', label: '作れる', icon: ChefHat },
  { id: 'useup', label: '使い切り', icon: Trash2 },
  { id: 'seasonal', label: '旬', icon: Leaf },
  { id: 'missing', label: '買い足せば', icon: ShoppingBasket },
  { id: 'weekly', label: '1週間の献立', icon: CalendarDays },
];

/**
 * 提案系のパネルを1つのタブにまとめ、上部のボタンで切り替える。
 * タブが増えすぎて選びにくかったため、目的別に整理した。
 */
export function SuggestSection({
  useUpTargets,
  initialMode = 'makeable',
  highProtein = false,
}: {
  useUpTargets: UseUpTarget[];
  initialMode?: Mode;
  /** 設定で「高タンパク」を選んでいれば、献立の初期値にする。 */
  highProtein?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <Button
              key={m.id}
              type="button"
              variant={active ? 'default' : 'outline'}
              size="sm"
              className="h-9 shrink-0 rounded-full px-4 font-normal"
              onClick={() => setMode(m.id)}
            >
              <Icon className="size-4" />
              {m.label}
            </Button>
          );
        })}
      </div>

      {mode === 'makeable' && <SuggestRecipesPanel />}
      {mode === 'useup' && <UseUpPanel targets={useUpTargets} />}
      {mode === 'seasonal' && <SeasonalPanel />}
      {mode === 'missing' && <MissingIngredientsPanel />}
      {mode === 'weekly' && <WeeklyPlanPanel defaultHighProtein={highProtein} />}
    </div>
  );
}
