'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { deleteShoppingItem, toggleChecked } from '@/features/shopping-list/actions';
import type { Database } from '@/types/database.types';

type ShoppingItem = Database['public']['Tables']['shopping_list_items']['Row'];

export function ShoppingItemRow({ item }: { item: ShoppingItem }) {
  const [optimisticChecked, setOptimisticChecked] = useState(item.is_checked);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setOptimisticChecked((prev) => !prev);
    startTransition(async () => {
      const result = await toggleChecked(item.id);
      if (!result.success) {
        setOptimisticChecked((prev) => !prev);
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteShoppingItem(item.id);
      if (!result.success) toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5">
      <Checkbox checked={optimisticChecked} onCheckedChange={handleToggle} disabled={isPending} className="size-5" />
      <div className={cn('flex-1 text-sm', optimisticChecked && 'text-muted-foreground line-through')}>
        {item.name}
        {item.quantity && <span className="ml-1.5 text-xs text-muted-foreground">{item.quantity}{item.unit}</span>}
      </div>
      {item.source === 'ai_suggested' && (
        <Badge variant="outline" className="font-normal">
          AI提案
        </Badge>
      )}
      <Button variant="ghost" size="icon" className="size-8" onClick={handleDelete} aria-label="削除">
        <Trash2 className="size-4 text-muted-foreground" />
      </Button>
    </div>
  );
}
