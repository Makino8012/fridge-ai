'use client';

import { useMemo, useState, useTransition } from 'react';
import { Barcode, Plus, Refrigerator, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { CATEGORY_OPTIONS } from '@/lib/constants';
import { getExpiryStatus } from '@/lib/date';
import { useRealtimeTableRefresh } from '@/lib/hooks/use-realtime-table';
import { IngredientCard } from '@/features/ingredients/components/ingredient-card';
import { IngredientForm } from '@/features/ingredients/components/ingredient-form';
import { QuickAddBar } from '@/features/ingredients/components/quick-add-bar';
import { BarcodeScanner } from '@/features/ingredients/components/barcode-scanner';
import { lookupBarcodeAction } from '@/features/ingredients/actions';
import type { CategoryId, Database } from '@/types/database.types';

type Ingredient = Database['public']['Tables']['ingredients']['Row'];
type SortKey = 'expiry' | 'name' | 'quantity';

const EXPIRY_RANK: Record<string, number> = { expired: 0, soon: 1, ok: 2, none: 3 };

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
  const [formOpen, setFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formPrefill, setFormPrefill] = useState<{ name?: string; barcode?: string | null } | undefined>();
  const [scannerOpen, setScannerOpen] = useState(false);
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
          すべて
        </Badge>
        {CATEGORY_OPTIONS.map((c) => (
          <Badge
            key={c.id}
            variant={category === c.id ? 'default' : 'outline'}
            className="cursor-pointer font-normal"
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </Badge>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Refrigerator}
          title={initialIngredients.length === 0 ? '食材がまだ登録されていません' : '該当する食材がありません'}
          description={initialIngredients.length === 0 ? '右下の+ボタンから追加しましょう' : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((ingredient) => (
            <IngredientCard key={ingredient.id} ingredient={ingredient} onEdit={openEditForm} />
          ))}
        </div>
      )}

      <div className="fixed bottom-24 right-4 flex flex-col items-center gap-3 md:bottom-8 md:right-8">
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
      />
    </div>
  );
}
