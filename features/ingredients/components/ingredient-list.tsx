'use client';

import { useMemo, useState, useTransition } from 'react';
import { Barcode, ChevronDown, ListPlus, Plus, Refrigerator, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { CATEGORY_OPTIONS, STORAGE_LOCATION_OPTIONS } from '@/lib/constants';
import { getExpiryStatus } from '@/lib/date';
import { cn } from '@/lib/utils';
import { useRealtimeTableRefresh } from '@/lib/hooks/use-realtime-table';
import { IngredientCard } from '@/features/ingredients/components/ingredient-card';
import { IngredientForm } from '@/features/ingredients/components/ingredient-form';
import { QuickAddBar } from '@/features/ingredients/components/quick-add-bar';
import { BarcodeScanner } from '@/features/ingredients/components/barcode-scanner';
import { ReceiptCapture } from '@/features/ingredients/components/receipt-capture';
import { AI_ENABLED } from '@/lib/features';
import { BulkAdd } from '@/features/ingredients/components/bulk-add';
import { lookupBarcodeAction } from '@/features/ingredients/actions';
import type { CategoryId, Database } from '@/types/database.types';

type Ingredient = Database['public']['Tables']['ingredients']['Row'];
type SortKey = 'expiry' | 'name' | 'quantity';
type GroupKey = 'storage' | 'category' | 'none';

const EXPIRY_RANK: Record<string, number> = { expired: 0, soon: 1, ok: 2, none: 3 };

const GROUP_OPTIONS: { id: GroupKey; label: string }[] = [
  { id: 'storage', label: '保存場所' },
  { id: 'category', label: '種類' },
  { id: 'none', label: 'まとめて' },
];

export function IngredientList({
  initialIngredients,
  householdId,
}: {
  initialIngredients: Ingredient[];
  householdId: string;
}) {
  useRealtimeTableRefresh('ingredients', householdId);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('expiry');
  const [group, setGroup] = useState<GroupKey>('storage');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formPrefill, setFormPrefill] = useState<{ name?: string; barcode?: string | null } | undefined>();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [, startLookup] = useTransition();

  const filtered = useMemo(() => {
    let items = initialIngredients;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (category !== 'all') {
      items = items.filter((i) => i.category_id === category);
    }

    const sorted = [...items];
    switch (sort) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
        break;
      case 'quantity':
        sorted.sort((a, b) => a.quantity - b.quantity);
        break;
      case 'expiry':
      default:
        sorted.sort(
          (a, b) =>
            (EXPIRY_RANK[getExpiryStatus(a.expiry_date)] ?? 99) -
            (EXPIRY_RANK[getExpiryStatus(b.expiry_date)] ?? 99),
        );
        break;
    }
    return sorted;
  }, [initialIngredients, search, category, sort]);

  // 在庫が増えても探しやすいよう、保存場所や種類ごとに見出しをつけて分ける。
  const groups = useMemo((): { key: string; label: string; items: Ingredient[] }[] => {
    if (group === 'none') {
      return [{ key: 'all', label: 'すべて', items: filtered }];
    }
    const options = group === 'storage' ? STORAGE_LOCATION_OPTIONS : CATEGORY_OPTIONS;
    return options
      .map((o) => ({
        key: o.id,
        label: o.label,
        items: filtered.filter((i) =>
          group === 'storage' ? i.storage_location_id === o.id : i.category_id === o.id,
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered, group]);

  // カテゴリー絞り込みチップに件数を出す(どこに何個あるか一目で分かる)。
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of initialIngredients) {
      counts.set(i.category_id, (counts.get(i.category_id) ?? 0) + 1);
    }
    return counts;
  }, [initialIngredients]);

  function openCreateForm() {
    setEditingIngredient(null);
    setFormPrefill(undefined);
    setFormOpen(true);
  }

  function openEditForm(ingredient: Ingredient) {
    setEditingIngredient(ingredient);
    setFormPrefill(undefined);
    setFormOpen(true);
  }

  function handleBarcodeDetected(code: string) {
    setScannerOpen(false);
    startLookup(async () => {
      const result = await lookupBarcodeAction(code);
      const name = result.success && result.data.found ? (result.data.name ?? '') : '';
      if (!name) {
        toast.info('商品名が見つかりませんでした。名前を入力してください');
      }
      setEditingIngredient(null);
      setFormPrefill({ name, barcode: code });
      setFormOpen(true);
    });
  }

  return (
    <div className="space-y-4">
      <QuickAddBar />

      <Button variant="outline" className="w-full" onClick={() => setBulkOpen(true)}>
        <ListPlus className="size-4" />
        まとめて追加（声・書き出し）
      </Button>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="食材を検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-32 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expiry">期限順</SelectItem>
            <SelectItem value="name">名前順</SelectItem>
            <SelectItem value="quantity">残り少ない順</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={category === 'all' ? 'default' : 'outline'}
          className="cursor-pointer font-normal"
          onClick={() => setCategory('all')}
        >
          すべて {initialIngredients.length}
        </Badge>
        {CATEGORY_OPTIONS.filter((c) => (categoryCounts.get(c.id) ?? 0) > 0).map((c) => (
          <Badge
            key={c.id}
            variant={category === c.id ? 'default' : 'outline'}
            className="cursor-pointer font-normal"
            onClick={() => setCategory(c.id)}
          >
            {c.label} {categoryCounts.get(c.id)}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-muted-foreground">分け方</span>
        <div className="flex gap-1.5">
          {GROUP_OPTIONS.map((g) => (
            <Button
              key={g.id}
              type="button"
              variant={group === g.id ? 'default' : 'outline'}
              size="sm"
              className="h-7 rounded-full px-3 text-xs font-normal"
              onClick={() => setGroup(g.id)}
            >
              {g.label}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Refrigerator}
          title={initialIngredients.length === 0 ? '食材がまだ登録されていません' : '該当する食材がありません'}
          description={initialIngredients.length === 0 ? '右下の+ボタンから追加しましょう' : undefined}
        />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => {
            const isCollapsed = collapsed.has(g.key);
            return (
              <section key={g.key} className="space-y-2.5">
                {group !== 'none' && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-1.5 border-b border-border/60 pb-2 text-left"
                    onClick={() =>
                      setCollapsed((prev) => {
                        const next = new Set(prev);
                        if (next.has(g.key)) next.delete(g.key);
                        else next.add(g.key);
                        return next;
                      })
                    }
                  >
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 text-muted-foreground transition-transform',
                        isCollapsed && '-rotate-90',
                      )}
                    />
                    <span className="text-sm font-bold tracking-tight">{g.label}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {g.items.length}
                    </span>
                  </button>
                )}
                {!isCollapsed && (
                  <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                    {g.items.map((ingredient) => (
                      <IngredientCard key={ingredient.id} ingredient={ingredient} onEdit={openEditForm} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <div className="hide-on-keyboard fixed bottom-24 left-4 flex flex-col items-center gap-3 md:bottom-8 md:left-auto md:right-8">
        {AI_ENABLED && <ReceiptCapture />}
        <Button
          size="icon"
          variant="secondary"
          className="size-12 rounded-full shadow-lg"
          onClick={() => setScannerOpen(true)}
          aria-label="バーコードで追加"
        >
          <Barcode className="size-5" />
        </Button>
        <Button
          size="icon"
          className="size-14 rounded-full shadow-lg"
          onClick={openCreateForm}
          aria-label="食材を追加"
        >
          <Plus className="size-6" />
        </Button>
      </div>

      <BulkAdd open={bulkOpen} onOpenChange={setBulkOpen} />

      <BarcodeScanner
        open={scannerOpen}
        onDetected={handleBarcodeDetected}
        onClose={() => setScannerOpen(false)}
      />

      <IngredientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        ingredient={editingIngredient}
        prefill={formPrefill}
        existingIngredients={initialIngredients}
      />
    </div>
  );
}
