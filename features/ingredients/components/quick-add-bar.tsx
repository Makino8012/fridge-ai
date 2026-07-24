'use client';

import { useState, useTransition } from 'react';
import { Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QUICK_ADD_PRESETS, type QuickAddPreset } from '@/data/quick-add-presets';
import { quickAddIngredient } from '@/features/ingredients/actions';

export function QuickAddBar() {
  const [isPending, startTransition] = useTransition();
  const [pendingName, setPendingName] = useState<string | null>(null);

  function handleAdd(preset: QuickAddPreset) {
    setPendingName(preset.name);
    startTransition(async () => {
      const result = await quickAddIngredient({
        name: preset.name,
        categoryId: preset.categoryId,
        storageLocationId: preset.storageLocationId,
        unit: preset.unit,
        quantity: preset.defaultQuantity,
      });
      setPendingName(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.data.mode === 'incremented'
          ? `${preset.name}を${preset.defaultQuantity}${preset.unit}追加しました`
          : `${preset.name}を登録しました`,
      );
    });
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Zap className="size-3.5 text-primary" />
        タップで即追加（すでにある食材は数量を足します）
      </p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {QUICK_ADD_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            disabled={isPending}
            onClick={() => handleAdd(preset)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors',
              'hover:border-primary/50 hover:bg-accent disabled:opacity-50',
              pendingName === preset.name && 'border-primary bg-accent',
            )}
          >
            <Plus className="size-3.5 text-primary" />
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
