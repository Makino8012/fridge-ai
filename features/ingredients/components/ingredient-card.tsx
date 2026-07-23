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
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{ingredient.name}</p>
            <ExpiryBadge expiryDate={ingredient.expiry_date} />
          </div>
          <p className="text-xs text-muted-foreground">
            {getStorageLocationLabel(ingredient.storage_location_id)}
            {ingredient.memo ? ` ・ ${ingredient.memo}` : ''}
          </p>
        </div>

        <QuantityQuickAdjust
          ingredientId={ingredient.id}
          quantity={ingredient.quantity}
          unit={ingredient.unit}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="メニュー">
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
