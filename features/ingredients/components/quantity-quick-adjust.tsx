'use client';

import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { adjustQuantity, updateIngredient } from '@/features/ingredients/actions';

// 数量の大きさに応じて増減の刻みを変える(300mlなら±10、卵10個なら±1)。
function stepFor(quantity: number): number {
  if (quantity >= 500) return 50;
  if (quantity >= 100) return 10;
  if (quantity >= 20) return 5;
  return 1;
}

export function QuantityQuickAdjust({
  ingredientId,
  quantity,
  unit,
}: {
  ingredientId: string;
  quantity: number;
  unit: string;
}) {
  const [displayQuantity, setDisplayQuantity] = useState(quantity);
  const [manualValue, setManualValue] = useState(String(quantity));
  const [open, setOpen] = useState(false);

  // タップのたびにサーバー通信すると固まるため、変化分をためて一定時間後にまとめて同期する。
  const pendingDeltaRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 外部(Realtime等)で数量が変わったら表示に反映(同期待ちの変化がないときのみ)。
  useEffect(() => {
    if (pendingDeltaRef.current === 0) setDisplayQuantity(quantity);
  }, [quantity]);

  function flush() {
    const delta = pendingDeltaRef.current;
    pendingDeltaRef.current = 0;
    if (delta === 0) return;
    void adjustQuantity(ingredientId, delta, 'manual_adjust').then((result) => {
      if (!result.success) toast.error(result.error);
    });
  }

  function adjust(sign: 1 | -1) {
    const step = stepFor(displayQuantity);
    const next = Math.max(0, displayQuantity + sign * step);
    const applied = next - displayQuantity;
    if (applied === 0) return;
    setDisplayQuantity(next);
    pendingDeltaRef.current += applied;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 600);
  }

  function submitManualValue() {
    const next = Number(manualValue);
    if (Number.isNaN(next) || next < 0) {
      toast.error('正しい数量を入力してください');
      return;
    }
    pendingDeltaRef.current = 0;
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayQuantity(next);
    setOpen(false);
    void updateIngredient({ id: ingredientId, quantity: next }).then((result) => {
      if (!result.success) toast.error(result.error);
    });
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="icon"
        className="size-9 shrink-0 rounded-full"
        disabled={displayQuantity <= 0}
        onClick={() => adjust(-1)}
        aria-label="減らす"
      >
        <Minus className="size-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="min-w-16 rounded-lg px-1 text-center text-sm font-medium tabular-nums hover:bg-muted"
            onClick={() => setManualValue(String(displayQuantity))}
          >
            {displayQuantity}
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
        className="size-9 shrink-0 rounded-full"
        onClick={() => adjust(1)}
        aria-label="増やす"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
