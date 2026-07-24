'use client';

import { useRef, useState, useTransition } from 'react';
import { ReceiptText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';
import { CATEGORY_OPTIONS } from '@/lib/constants';
import { addReceiptItemsAction, extractReceiptItemsAction } from '@/features/ingredients/actions';
import type { ReceiptItem } from '@/lib/ai/types';
import type { CategoryId } from '@/types/database.types';

// 画像を長辺1200pxに縮小してJPEG base64にする(送信量とAPIコストを抑える)。
async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const maxEdge = 1200;
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas not available');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const jpeg = canvas.toDataURL('image/jpeg', 0.7);
  return jpeg.split(',')[1] ?? '';
}

export function ReceiptCapture({ className }: { className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ReceiptItem[] | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [isProcessing, startProcessing] = useTransition();
  const [isSaving, startSaving] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 同じ写真を選び直せるようにリセット
    if (!file) return;

    let base64: string;
    try {
      base64 = await compressImage(file);
    } catch {
      toast.error('画像を読み込めませんでした');
      return;
    }

    startProcessing(async () => {
      const result = await extractReceiptItemsAction({ imageBase64: base64, mediaType: 'image/jpeg' });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.data.length === 0) {
        toast.info('食材を読み取れませんでした。明るい場所で撮り直してみてください');
        return;
      }
      setItems(result.data);
      setReviewOpen(true);
    });
  }

  function updateItem(index: number, patch: Partial<ReceiptItem>) {
    setItems((prev) => prev?.map((item, i) => (i === index ? { ...item, ...patch } : item)) ?? null);
  }

  function removeItem(index: number) {
    setItems((prev) => prev?.filter((_, i) => i !== index) ?? null);
  }

  function handleSave() {
    if (!items || items.length === 0) return;
    startSaving(async () => {
      const result = await addReceiptItemsAction(items);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.data.added}品を在庫に登録しました`);
      setReviewOpen(false);
      setItems(null);
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        size="icon"
        variant="secondary"
        className={cn('size-12 rounded-full shadow-lg', className)}
        onClick={() => inputRef.current?.click()}
        disabled={isProcessing}
        aria-label="レシートで追加"
      >
        {isProcessing ? <LoadingSpinner /> : <ReceiptText className="size-5" />}
      </Button>

      <Drawer open={reviewOpen} onOpenChange={setReviewOpen}>
        <DrawerContent>
          <div className="mx-auto flex max-h-[85vh] w-full max-w-md flex-col">
            <DrawerHeader>
              <DrawerTitle>読み取った食材</DrawerTitle>
              <DrawerDescription>内容を確認・修正して登録してください。</DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 space-y-2 overflow-y-auto px-4">
              {items?.map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border p-2">
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(i, { name: e.target.value })}
                    className="h-9 flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                    className="h-9 w-16"
                  />
                  <Select
                    value={item.categoryId}
                    onValueChange={(v) => updateItem(i, { categoryId: v as CategoryId })}
                  >
                    <SelectTrigger className="h-9 w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() => removeItem(i)}
                    aria-label="削除"
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>

            <DrawerFooter>
              <Button onClick={handleSave} disabled={isSaving || !items || items.length === 0}>
                {isSaving ? (
                  <LoadingSpinner className="text-primary-foreground" />
                ) : (
                  `${items?.length ?? 0}品をまとめて登録`
                )}
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
