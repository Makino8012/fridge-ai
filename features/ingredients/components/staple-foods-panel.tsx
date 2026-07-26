'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { setStapleQuantityAction } from '@/features/ingredients/actions';
import { guessStorage } from '@/lib/ingredient-guess';
import { STAPLE_CATEGORIES, stepOfUnit, type StapleCategory } from '@/lib/staple-foods';
import { displayQuantity } from '@/lib/quantity';
import type { Database } from '@/types/database.types';

type Ingredient = Database['public']['Tables']['ingredients']['Row'];

/**
 * よく買う肉・野菜などを一覧で出し、数量だけを増減させる画面。
 *
 * 定番の食材まで毎回「名前を入力して追加」するのは手間だし、
 * 表記がぶれてレシピと照合できなくなる。ここでは名前を固定し、
 * 手元にある数だけを合わせてもらう。0にすると在庫から消える。
 * カタログに無いものは、今まで通り「追加」から都度登録する。
 */
export function StapleFoodsPanel({ ingredients }: { ingredients: Ingredient[] }) {
  const [activeCategory, setActiveCategory] = useState<StapleCategory>(STAPLE_CATEGORIES[0]!);
  const [, startTransition] = useTransition();

  // 押した瞬間に数字を動かす。サーバー反映を待つと連打できない。
  const [quantities, setQuantity] = useOptimistic(
    Object.fromEntries(ingredients.map((i) => [i.name, i.quantity])) as Record<string, number>,
    (state: Record<string, number>, change: { name: string; quantity: number }) => ({
      ...state,
      [change.name]: change.quantity,
    }),
  );

  /** 登録済みなら在庫の単位を優先する(過去にgで登録したものをパックに変えない)。 */
  function unitOf(name: string, fallback: string): string {
    return ingredients.find((i) => i.name === name)?.unit ?? fallback;
  }

  function change(name: string, unit: string, categoryId: StapleCategory['categoryId'], delta: number) {
    const current = quantities[name] ?? 0;
    const next = Math.max(0, current + delta);
    if (next === current) return;

    startTransition(async () => {
      setQuantity({ name, quantity: next });
      const result = await setStapleQuantityAction({
        name,
        quantity: next,
        unit,
        categoryId,
        storageLocationId: guessStorage(categoryId, name) ?? 'fridge',
      });
      if (!result.success) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        よく買う食材です。手元にある数に合わせてください。0にすると在庫から消えます。
        ここに無いものは「＋」から追加できます。
      </p>

      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {STAPLE_CATEGORIES.map((category) => (
          <Button
            key={category.categoryId + category.label}
            type="button"
            variant={activeCategory.label === category.label ? 'default' : 'outline'}
            size="sm"
            className="h-8 shrink-0 rounded-full px-3.5 text-xs font-normal"
            onClick={() => setActiveCategory(category)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {activeCategory.groups.map((group) => (
          <section key={group.label} className="space-y-1.5">
            <h3 className="text-xs font-medium text-muted-foreground">{group.label}</h3>
            <ul className="divide-y rounded-xl border">
              {group.items.map((item) => {
                const unit = unitOf(item.name, item.unit);
                const quantity = quantities[item.name] ?? 0;
                const step = stepOfUnit(unit);
                const inStock = quantity > 0;

                return (
                  <li key={item.name} className="flex items-center gap-2 px-3 py-2">
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate text-sm',
                        !inStock && 'text-muted-foreground',
                      )}
                    >
                      {item.name}
                    </span>

                    <span
                      className={cn(
                        'w-20 shrink-0 text-right text-sm tabular-nums',
                        inStock ? 'font-medium' : 'text-muted-foreground/50',
                      )}
                    >
                      {inStock ? displayQuantity(quantity, unit) : '—'}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8 shrink-0 rounded-full"
                      disabled={!inStock}
                      onClick={() => change(item.name, unit, activeCategory.categoryId, -step)}
                      aria-label={`${item.name}を減らす`}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8 shrink-0 rounded-full"
                      onClick={() => change(item.name, unit, activeCategory.categoryId, step)}
                      aria-label={`${item.name}を増やす`}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
