'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Minus, Plus } from 'lucide-react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  CATEGORY_OPTIONS,
  STORAGE_LOCATION_OPTIONS,
  getStorageLocationLabel,
} from '@/lib/constants';
import { createIngredient, updateIngredient } from '@/features/ingredients/actions';
import { ingredientFormSchema, type IngredientFormInput } from '@/features/ingredients/schema';
import {
  ROUGH_LEVELS,
  displayQuantity,
  formatQuantity,
  isMeasureUnit,
  isRoughUnit,
  parseQuantity,
} from '@/lib/quantity';
import { UNIT_PRESETS, guessCategory, guessStorage, guessUnit } from '@/lib/ingredient-guess';
import type { Database } from '@/types/database.types';

type Ingredient = Database['public']['Tables']['ingredients']['Row'];

const QUANTITY_PRESETS = ['¼', '½', '¾', '1'];

// 「1/2」「½」「0.5」などの分数入力に対応した数量フィールド。
// react-hook-form には数値で渡しつつ、表示は分数記号にする。
// 分数ボタンは「個」「本」など数えられる単位のときだけ出す(gやmlでは不要)。
function QuantityField({
  value,
  onChange,
  unit,
}: {
  value: number;
  onChange: (n: number) => void;
  unit: string;
}) {
  const [text, setText] = useState(() => formatQuantity(value));
  const rough = isRoughUnit(unit);
  const showFractions = !isMeasureUnit(unit);

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

  function step(delta: number) {
    const next = Math.max(0, Math.round((value + delta) * 100) / 100);
    onChange(next);
    setText(formatQuantity(next));
  }

  // ざっくり量のときは数値入力ではなく「たっぷり/半分/…」のボタンで選ぶ。
  if (rough) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {ROUGH_LEVELS.map((level) => (
          <Button
            key={level.label}
            type="button"
            variant={value === level.value ? 'default' : 'outline'}
            size="sm"
            className="h-9 px-3 text-xs font-normal"
            onClick={() => onChange(level.value)}
          >
            {level.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          onClick={() => step(showFractions ? -1 : -10)}
          aria-label="数量を減らす"
        >
          <Minus className="size-4" />
        </Button>
        <Input
          inputMode="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          className="h-10 text-center text-base"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          onClick={() => step(showFractions ? 1 : 10)}
          aria-label="数量を増やす"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {showFractions && (
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
      )}
    </div>
  );
}

// 選択肢をタップで選べるチップ列。プルダウンより操作が速い。
function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Button
          key={o.id}
          type="button"
          variant={value === o.id ? 'default' : 'outline'}
          size="sm"
          className="h-8 rounded-full px-3 text-xs font-normal"
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

// 賞味期限を「今日から◯日」で手早く設定する。
const EXPIRY_PRESETS = [
  { label: '3日', days: 3 },
  { label: '1週間', days: 7 },
  { label: '2週間', days: 14 },
  { label: '1ヶ月', days: 30 },
];

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  existingIngredients = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: Ingredient | null;
  prefill?: { name?: string; barcode?: string | null };
  existingIngredients?: Ingredient[];
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

  // ユーザーが自分でカテゴリー等を選んだら、以後は自動推測で上書きしない。
  const touched = useRef<{ category: boolean; unit: boolean; storage: boolean }>({
    category: false,
    unit: false,
    storage: false,
  });

  useEffect(() => {
    if (open) {
      touched.current = { category: false, unit: false, storage: false };
      form.reset(
        ingredient ? toFormValues(ingredient) : { ...EMPTY_VALUES, name: prefill?.name ?? '' },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ingredient, prefill?.name]);

  const name = form.watch('name');

  // 同じ食材をうっかり二重登録しないよう、名前が一致する在庫があれば知らせる。
  const duplicate = useMemo(() => {
    if (isEdit) return null;
    const n = name.trim();
    if (n.length < 2) return null;
    return (
      existingIngredients.find((i) => i.name === n) ??
      existingIngredients.find((i) => i.name.includes(n) || n.includes(i.name)) ??
      null
    );
  }, [name, existingIngredients, isEdit]);

  function addToExisting() {
    if (!duplicate) return;
    const add = form.getValues('quantity');
    startTransition(async () => {
      const result = await updateIngredient({
        id: duplicate.id,
        quantity: Math.round((duplicate.quantity + add) * 100) / 100,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `${duplicate.name}の在庫を${displayQuantity(duplicate.quantity + add, duplicate.unit)}にしました`,
      );
      onOpenChange(false);
    });
  }

  // 食材名からカテゴリー・単位・保存場所を自動で推測して埋める(新規追加のときだけ)。
  useEffect(() => {
    if (isEdit) return;
    const category = guessCategory(name);
    if (category && !touched.current.category) form.setValue('categoryId', category);
    const unit = guessUnit(name);
    if (unit && !touched.current.unit) form.setValue('unit', unit);
    const storage = guessStorage(category, name);
    if (storage && !touched.current.storage) form.setValue('storageLocationId', storage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, isEdit]);

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
        {/* ドロワーの高さ上限内でフォームだけをスクロールさせる(PCで上部が見切れないように) */}
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-col">
          <DrawerHeader className="shrink-0">
            <DrawerTitle>{isEdit ? '食材を編集' : '食材を追加'}</DrawerTitle>
          </DrawerHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
              {/* 入力欄だけスクロールさせ、保存ボタンは常に見えるようにする */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-2">
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

                {duplicate && (
                  <div className="rounded-xl border border-warning/40 bg-warning/10 p-3">
                    <p className="text-xs">
                      すでに「{duplicate.name}」が
                      {getStorageLocationLabel(duplicate.storage_location_id)}に
                      <span className="font-medium">
                        {displayQuantity(duplicate.quantity, duplicate.unit)}
                      </span>
                      あります。
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-2 h-8 text-xs"
                      disabled={isPending}
                      onClick={addToExisting}
                    >
                      別で登録せず、この在庫に数量を足す
                    </Button>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>単位</FormLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {UNIT_PRESETS.map((u) => (
                          <Button
                            key={u}
                            type="button"
                            variant={field.value === u ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 min-w-11 rounded-full px-3 text-xs font-normal"
                            onClick={() => {
                              touched.current.unit = true;
                              field.onChange(u);
                            }}
                          >
                            {u}
                          </Button>
                        ))}
                      </div>
                      <FormControl>
                        <Input
                          placeholder="その他の単位を入力"
                          className="h-9"
                          {...field}
                          onChange={(e) => {
                            touched.current.unit = true;
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>数量（{form.watch('unit') || '単位'}）</FormLabel>
                      <FormControl>
                        <QuantityField
                          value={field.value}
                          onChange={field.onChange}
                          unit={form.watch('unit')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>カテゴリー</FormLabel>
                      <ChipSelect
                        options={CATEGORY_OPTIONS}
                        value={field.value}
                        onChange={(v) => {
                          touched.current.category = true;
                          field.onChange(v);
                        }}
                      />
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
                      <ChipSelect
                        options={STORAGE_LOCATION_OPTIONS}
                        value={field.value}
                        onChange={(v) => {
                          touched.current.storage = true;
                          field.onChange(v);
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>賞味期限(任意)</FormLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {EXPIRY_PRESETS.map((p) => {
                          const iso = addDaysISO(p.days);
                          return (
                            <Button
                              key={p.days}
                              type="button"
                              variant={field.value === iso ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 rounded-full px-3 text-xs font-normal"
                              onClick={() => field.onChange(field.value === iso ? null : iso)}
                            >
                              {p.label}後
                            </Button>
                          );
                        })}
                        {field.value && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full px-3 text-xs font-normal text-muted-foreground"
                            onClick={() => field.onChange(null)}
                          >
                            クリア
                          </Button>
                        )}
                      </div>
                      <FormControl>
                        <Input
                          type="date"
                          className="h-9"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
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
              </div>

              <DrawerFooter className="shrink-0 border-t bg-background px-4">
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
