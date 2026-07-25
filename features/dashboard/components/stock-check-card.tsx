'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Check, HelpCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { displayQuantity } from '@/lib/quantity';
import { confirmStillHaveAction, markUsedUpAction } from '@/features/ingredients/actions';
import type { StockCheckItem } from '@/lib/stock-check';

/**
 * 「これまだある?」を数点だけ聞くカード。
 * 在庫の登録漏れ・減らし忘れを、棚卸しさせずに少しずつ直すための入口。
 */
export function StockCheckCard({ items }: { items: StockCheckItem[] }) {
  // 答えた分はその場で消したいので、サーバーの再取得を待たずに畳む。
  const [answered, setAnswered] = useState<string[]>([]);
  const [optimisticAnswered, addAnswered] = useOptimistic(answered, (state: string[], id: string) => [
    ...state,
    id,
  ]);
  const [, startTransition] = useTransition();

  const remaining = items.filter((item) => !optimisticAnswered.includes(item.id));
  if (remaining.length === 0) return null;

  function answer(item: StockCheckItem, stillHave: boolean) {
    startTransition(async () => {
      addAnswered(item.id);
      const result = stillHave
        ? await confirmStillHaveAction(item.id)
        : await markUsedUpAction(item.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setAnswered((prev) => [...prev, item.id]);
      if (!stillHave) toast.success(`${item.name}を在庫から消しました`);
    });
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm font-medium">これ、まだある?</p>
        </div>
        <p className="text-xs text-muted-foreground">
          在庫が実物とズレるとレシピの提案も外れます。答えるほど提案が当たるようになります。
        </p>

        <ul className="space-y-2">
          {remaining.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {item.name}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {displayQuantity(item.quantity, item.unit)}
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">{item.reason}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 shrink-0 px-3"
                onClick={() => answer(item, true)}
              >
                <Check className="size-3.5" />
                ある
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 px-3 text-muted-foreground"
                onClick={() => answer(item, false)}
              >
                <X className="size-3.5" />
                もう無い
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
