'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ShoppingCart, Sparkles, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useRealtimeTableRefresh } from '@/lib/hooks/use-realtime-table';
import { ShoppingItemRow } from '@/features/shopping-list/components/shopping-item-row';
import {
  addShoppingItem,
  clearCheckedItems,
  importAiSuggestedItems,
  suggestShoppingListAction,
} from '@/features/shopping-list/actions';
import type { Database } from '@/types/database.types';

type ShoppingItem = Database['public']['Tables']['shopping_list_items']['Row'];
type AiSuggestedItem = { name: string; quantity: string; unit: string; reason: string };

export function ShoppingListView({
  initialItems,
  householdId,
}: {
  initialItems: ShoppingItem[];
  householdId: string;
}) {
  useRealtimeTableRefresh('shopping_list_items', householdId);

  const [newItemName, setNewItemName] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestedItem[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAiPending, startAiTransition] = useTransition();

  const { unchecked, checked } = useMemo(() => {
    return {
      unchecked: initialItems.filter((i) => !i.is_checked),
      checked: initialItems.filter((i) => i.is_checked),
    };
  }, [initialItems]);

  function handleAdd() {
    if (!newItemName.trim()) return;
    const name = newItemName.trim();
    setNewItemName('');
    startTransition(async () => {
      const result = await addShoppingItem({ name, quantity: null, unit: null });
      if (!result.success) toast.error(result.error);
    });
  }

  function handleSuggest() {
    startAiTransition(async () => {
      const result = await suggestShoppingListAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setAiSuggestions(result.data);
    });
  }

  function handleImportAll() {
    if (!aiSuggestions || aiSuggestions.length === 0) return;
    startTransition(async () => {
      const result = await importAiSuggestedItems(aiSuggestions);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('買い物リストに追加しました');
      setAiSuggestions(null);
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

      <Button variant="outline" className="w-full" onClick={handleSuggest} disabled={isAiPending}>
        {isAiPending ? <LoadingSpinner /> : <Sparkles className="size-4" />}
        AIに不足食材を提案してもらう
      </Button>

      {aiSuggestions && (
        <Card className="rounded-2xl">
          <CardContent className="space-y-3 p-4">
            {aiSuggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">追加提案はありませんでした</p>
            ) : (
              <>
                <ul className="space-y-1.5 text-sm">
                  {aiSuggestions.map((item, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span>
                        {item.name} <span className="text-xs text-muted-foreground">{item.quantity}{item.unit}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <Button size="sm" onClick={handleImportAll} disabled={isPending}>
                  すべて買い物リストに追加
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {unchecked.length === 0 && checked.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="買い物リストは空です" />
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
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
              {checked.map((item) => (
                <ShoppingItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
