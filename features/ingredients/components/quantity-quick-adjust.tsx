'use client';

import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { adjustQuantity, updateIngredient } from '@/features/ingredients/actions';
import { formatQuantity, parseQuantity, roundQuantity, stepForQuantity } from '@/lib/quantity';

// 直接入力ポップオーバーで使う分数のクイックボタン。
const FRACTION_PRESETS = ['¼', '½', '¾', '1'];

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
    const step = stepForQuantity(displayQuantity, unit);
    const next = roundQuantity(Math.max(0, displayQuantity + sign * step));
    const applied = roundQuantity(next - displayQuantity);
    if (applied === 0) return;
    setDisplayQuantity(next);
    pendingDeltaRef.current = roundQuantity(pendingDeltaRef.current + applied);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 600);
  }

  function saveExactValue(next: number) {
    pendingDeltaRef.current = 0;
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayQuantity(next);
    setOpen(false);
    void updateIngredient({ id: ingredientId, quantity: next }).then((result) => {
      if (!result.success) toast.error(result.error);
    });
  }

  function submitManualValue() {
    const next = parseQuantity(manualValue);
    if (next === null) {
      toast.error('「1/2」「0.5」などで入力してください');
      return;
    }
    saveExactValue(next);
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
            onClick={() => setManualValue(formatQuantity(displayQuantity))}
          >
            {formatQuantity(displayQuantity)}
            {unit}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 space-y-2">
          <p className="text-xs text-muted-foreground">数量を直接入力(「1/2」「0.5」もOK)</p>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="text"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitManualValue();
                }
              }}
              className="h-9"
            />
            <Button size="sm" onClick={submitManualValue}>
              保存
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FRACTION_PRESETS.map((f) => (
              <Button
                key={f}
                type="button"
                variant="outline"
                size="sm"
                className="h-8 min-w-9 px-2"
                onClick={() => saveExactValue(parseQuantity(f)!)}
              >
                {f}
                {unit}
              </Button>
            ))}
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
