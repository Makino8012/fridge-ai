'use client';

import { useMemo, useOptimistic, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { useRealtimeTableRefresh } from '@/lib/hooks/use-realtime-table';
import { ShoppingItemRow } from '@/features/shopping-list/components/shopping-item-row';
import { addShoppingItem, clearCheckedItems } from '@/features/shopping-list/actions';
import type { Database } from '@/types/database.types';

type ShoppingItem = Database['public']['Tables']['shopping_list_items']['Row'];

export function ShoppingListView({
  initialItems,
  householdId,
}: {
  initialItems: ShoppingItem[];
  householdId: string;
}) {
  useRealtimeTableRefresh('shopping_list_items', householdId);

  const [newItemName, setNewItemName] = useState('');
  const [isPending, startTransition] = useTransition();

  // 追加した瞬間にリストへ表示する(サーバー再取得を待たない)。
  // サーバー反映後は initialItems が更新され、この楽観的表示は自動で置き換わる。
  const [optimisticItems, addOptimisticItems] = useOptimistic(
    initialItems,
    (state: ShoppingItem[], newItems: ShoppingItem[]) => [...state, ...newItems],
  );

  function makeOptimisticItem(name: string, quantity: number | null, unit: string | null): ShoppingItem {
    return {
      id: `temp-${crypto.randomUUID()}`,
      household_id: householdId,
      name,
      quantity,
      unit,
      is_checked: false,
      source: 'manual',
      created_by: null,
      checked_by: null,
      created_at: new Date().toISOString(),
      checked_at: null,
    };
  }

  const { unchecked, checked } = useMemo(() => {
    return {
      unchecked: optimisticItems.filter((i) => !i.is_checked),
      checked: optimisticItems.filter((i) => i.is_checked),
    };
  }, [optimisticItems]);

  function handleAdd() {
    if (!newItemName.trim()) return;
    const name = newItemName.trim();
    setNewItemName('');
    startTransition(async () => {
      addOptimisticItems([makeOptimisticItem(name, null, null)]);
      const result = await addShoppingItem({ name, quantity: null, unit: null });
      if (!result.success) toast.error(result.error);
    });
  }

  function handleClearChecked() {
    startTransition(async () => {
      const result = await clearCheckedItems();
      if (!result.success) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Input
          placeholder="買うものを入力してEnter"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={isPending}>
          追加
        </Button>
      </div>



      {unchecked.length === 0 && checked.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="買い物リストは空です" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            {unchecked.map((item) => (
              <ShoppingItemRow key={item.id} item={item} />
            ))}
          </div>

          {checked.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">完了済み ({checked.length})</p>
                <Button variant="ghost" size="sm" onClick={handleClearChecked} disabled={isPending}>
                  <Trash2 className="size-3.5" /> 削除
                </Button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {checked.map((item) => (
                  <ShoppingItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
