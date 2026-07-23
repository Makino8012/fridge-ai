'use client';

import { useState, useTransition } from 'react';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { adjustQuantity, updateIngredient } from '@/features/ingredients/actions';

export function QuantityQuickAdjust({
  ingredientId,
  quantity,
  unit,
}: {
  ingredientId: string;
  quantity: number;
  unit: string;
}) {
  const [optimisticQuantity, setOptimisticQuantity] = useState(quantity);
  const [isPending, startTransition] = useTransition();
  const [manualValue, setManualValue] = useState(String(quantity));
  const [open, setOpen] = useState(false);

  function adjust(delta: number) {
    const next = Math.max(0, optimisticQuantity + delta);
    setOptimisticQuantity(next);
    startTransition(async () => {
      const result = await adjustQuantity(ingredientId, delta, 'manual_adjust');
      if (!result.success) {
        setOptimisticQuantity(optimisticQuantity);
        toast.error(result.error);
      }
    });
  }

  function submitManualValue() {
    const next = Number(manualValue);
    if (Number.isNaN(next) || next < 0) {
      toast.error('正しい数量を入力してください');
      return;
    }
    setOptimisticQuantity(next);
    setOpen(false);
    startTransition(async () => {
      const result = await updateIngredient({ id: ingredientId, quantity: next });
      if (!result.success) toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="icon"
        className="size-9 rounded-full"
        disabled={isPending || optimisticQuantity <= 0}
        onClick={() => adjust(-1)}
        aria-label="1減らす"
      >
        <Minus className="size-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="min-w-14 rounded-lg px-1 text-center text-sm font-medium tabular-nums hover:bg-muted"
            onClick={() => setManualValue(String(optimisticQuantity))}
          >
            {optimisticQuantity}
            {unit}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 space-y-2">
          <p className="text-xs text-muted-foreground">数量を直接入力</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              className="h-9"
            />
            <Button size="sm" onClick={submitManualValue}>
              保存
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        className="size-9 rounded-full"
        disabled={isPending}
        onClick={() => adjust(1)}
        aria-label="1増やす"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
