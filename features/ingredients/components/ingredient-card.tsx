'use client';

import { useState, useTransition } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CATEGORY_ICONS } from '@/lib/category-icons';
import { getStorageLocationLabel } from '@/lib/constants';
import { ExpiryBadge } from '@/features/ingredients/components/expiry-badge';
import { QuantityQuickAdjust } from '@/features/ingredients/components/quantity-quick-adjust';
import { deleteIngredient } from '@/features/ingredients/actions';
import type { Database } from '@/types/database.types';

type Ingredient = Database['public']['Tables']['ingredients']['Row'];

export function IngredientCard({
  ingredient,
  onEdit,
}: {
  ingredient: Ingredient;
  onEdit: (ingredient: Ingredient) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const Icon = CATEGORY_ICONS[ingredient.category_id];

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteIngredient(ingredient.id);
      if (!result.success) toast.error(result.error);
      else toast.success(`${ingredient.name}を削除しました`);
      setConfirmOpen(false);
    });
  }

  return (
    <Card className="rounded-2xl">
      {/* 在庫が増えても一覧しやすいよう、1行にまとめたコンパクトなレイアウト */}
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4.5" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-snug">{ingredient.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <ExpiryBadge item={ingredient} />
            <span className="text-[11px] text-muted-foreground">
              {getStorageLocationLabel(ingredient.storage_location_id)}
              {ingredient.memo ? ` ・ ${ingredient.memo}` : ''}
            </span>
          </div>
        </div>

        <QuantityQuickAdjust
          ingredientId={ingredient.id}
          quantity={ingredient.quantity}
          unit={ingredient.unit}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-1 size-8 shrink-0" aria-label="メニュー">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(ingredient)}>
              <Pencil className="size-4" /> 編集
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4" /> 削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ingredient.name}を削除しますか?</AlertDialogTitle>
            <AlertDialogDescription>この操作は取り消せません。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={handleDelete}>
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
