'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { CATEGORY_OPTIONS, STORAGE_LOCATION_OPTIONS } from '@/lib/constants';
import { createIngredient, updateIngredient } from '@/features/ingredients/actions';
import { ingredientFormSchema, type IngredientFormInput } from '@/features/ingredients/schema';
import { formatQuantity, parseQuantity } from '@/lib/quantity';
import type { Database } from '@/types/database.types';

type Ingredient = Database['public']['Tables']['ingredients']['Row'];

const QUANTITY_PRESETS = ['¼', '½', '¾', '1'];

// 「1/2」「½」「0.5」などの分数入力に対応した数量フィールド。
// react-hook-form には数値で渡しつつ、表示は分数記号にする。
function QuantityField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [text, setText] = useState(() => formatQuantity(value));

  useEffect(() => {
    setText(formatQuantity(value));
  }, [value]);

  function commit(raw: string) {
    const parsed = parseQuantity(raw);
    if (parsed !== null) {
      onChange(parsed);
      setText(formatQuantity(parsed));
    } else {
      setText(formatQuantity(value));
    }
  }

  return (
    <div className="space-y-1.5">
      <Input
        inputMode="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
      />
      <div className="flex gap-1.5">
        {QUANTITY_PRESETS.map((f) => (
          <Button
            key={f}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 flex-1 px-0 text-xs"
            onClick={() => {
              const n = parseQuantity(f)!;
              onChange(n);
              setText(formatQuantity(n));
            }}
          >
            {f}
          </Button>
        ))}
      </div>
    </div>
  );
}

const EMPTY_VALUES: IngredientFormInput = {
  name: '',
  quantity: 1,
  unit: '個',
  categoryId: 'vegetable',
  storageLocationId: 'fridge',
  expiryDate: null,
  memo: null,
};

function toFormValues(ingredient: Ingredient): IngredientFormInput {
  return {
    name: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    categoryId: ingredient.category_id,
    storageLocationId: ingredient.storage_location_id,
    expiryDate: ingredient.expiry_date,
    memo: ingredient.memo,
  };
}

export function IngredientForm({
  open,
  onOpenChange,
  ingredient,
  prefill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: Ingredient | null;
  prefill?: { name?: string; barcode?: string | null };
}) {
  const isEdit = Boolean(ingredient);
  const [isPending, startTransition] = useTransition();

  const initialValues = ingredient
    ? toFormValues(ingredient)
    : { ...EMPTY_VALUES, name: prefill?.name ?? '' };

  const form = useForm<IngredientFormInput>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(ingredient ? toFormValues(ingredient) : { ...EMPTY_VALUES, name: prefill?.name ?? '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ingredient, prefill?.name]);

  function submit(values: IngredientFormInput, keepOpen: boolean) {
    startTransition(async () => {
      const result = isEdit
        ? await updateIngredient({ id: ingredient!.id, ...values })
        : await createIngredient(
            values,
            prefill?.barcode ? { source: 'barcode', barcode: prefill.barcode } : undefined,
          );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (keepOpen && !isEdit) {
        toast.success(`${values.name}を登録しました。続けて入力できます`);
        form.reset(EMPTY_VALUES);
        form.setFocus('name');
        return;
      }

      toast.success(isEdit ? '更新しました' : '食材を登録しました');
      onOpenChange(false);
    });
  }

  function onSubmit(values: IngredientFormInput) {
    submit(values, false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>{isEdit ? '食材を編集' : '食材を追加'}</DrawerTitle>
          </DrawerHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>食材名</FormLabel>
                    <FormControl>
                      <Input placeholder="例: 卵" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>数量</FormLabel>
                      <FormControl>
                        <QuantityField value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>単位</FormLabel>
                      <FormControl>
                        <Input placeholder="個 / g / ml" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>カテゴリー</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storageLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>保存場所</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STORAGE_LOCATION_OPTIONS.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>賞味期限(任意)</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メモ(任意)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DrawerFooter className="px-0">
                <Button type="submit" disabled={isPending}>
                  {isPending ? <LoadingSpinner className="text-primary-foreground" /> : '保存'}
                </Button>
                {!isEdit && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isPending}
                    onClick={form.handleSubmit((values) => submit(values, true))}
                  >
                    保存して続けて追加
                  </Button>
                )}
                <DrawerClose asChild>
                  <Button variant="outline" type="button">
                    キャンセル
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
