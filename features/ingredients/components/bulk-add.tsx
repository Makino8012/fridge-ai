'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Mic, MicOff, Sparkles, Trash2, Wand2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { createIngredientsBulk } from '@/features/ingredients/actions';
import { parseBulkIngredients, type ParsedIngredient } from '@/lib/bulk-parse';
import { getCategoryLabel, getStorageLocationLabel } from '@/lib/constants';
import { formatQuantity, parseQuantity } from '@/lib/quantity';
import { cn } from '@/lib/utils';

const EXAMPLE = '牛乳と卵、キャベツ2個、豚こま肉300g';

// ブラウザの音声認識(Web Speech API)。対応していない環境では音声ボタンを出さない。
type SpeechResultList = ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: SpeechResultList }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function BulkAdd({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [text, setText] = useState('');
  const [items, setItems] = useState<ParsedIngredient[] | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [isPending, startTransition] = useTransition();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSpeechAvailable(getSpeechRecognition() !== null);
  }, []);

  useEffect(() => {
    if (open) {
      setText('');
      setItems(null);
      setInterim('');
    }
    return () => recognitionRef.current?.stop();
  }, [open]);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setInterim('');
      return;
    }

    const Recognition = getSpeechRecognition();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    // 話し終わるのを待たず、認識中の言葉もその場で表示する(反映が速く感じる)。
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let confirmed = '';
      let inProgress = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript ?? '';
        if (result?.isFinal) confirmed += transcript;
        else inProgress += transcript;
      }
      setText(confirmed + inProgress);
      setInterim(inProgress);
    };
    recognition.onerror = () => {
      toast.error('音声を聞き取れませんでした');
      setListening(false);
      setInterim('');
    };
    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function analyze() {
    const parsed = parseBulkIngredients(text);
    if (parsed.length === 0) {
      toast.error('食材を読み取れませんでした');
      return;
    }
    setItems(parsed);
  }

  function updateItem(index: number, patch: Partial<ParsedIngredient>) {
    setItems((prev) => prev?.map((item, i) => (i === index ? { ...item, ...patch } : item)) ?? null);
  }

  function removeItem(index: number) {
    setItems((prev) => prev?.filter((_, i) => i !== index) ?? null);
  }

  function save() {
    if (!items || items.length === 0) return;
    startTransition(async () => {
      const result = await createIngredientsBulk(
        items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          categoryId: item.categoryId,
          storageLocationId: item.storageLocationId,
          expiryDate: null,
          memo: null,
        })),
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.data.created}件の食材を登録しました`);
      onOpenChange(false);
    });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-col">
          <DrawerHeader className="shrink-0">
            <DrawerTitle>まとめて追加</DrawerTitle>
          </DrawerHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-2">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                買ってきたものをまとめて書くか、話しかけてください。
                <br />
                例: {EXAMPLE}
              </p>
              <Textarea
                rows={3}
                placeholder={EXAMPLE}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              {listening && (
                <p className="flex items-center gap-1.5 text-xs text-primary">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  {interim !== '' ? `聞き取り中: ${interim}` : '聞き取り中…話してください'}
                </p>
              )}
              <div className="flex gap-2">
                {speechAvailable && (
                  <Button
                    type="button"
                    variant={listening ? 'default' : 'outline'}
                    className={cn('flex-1', listening && 'animate-pulse')}
                    onClick={toggleListening}
                  >
                    {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                    {listening ? '聞き取り中…停止' : '声で入力'}
                  </Button>
                )}
                <Button type="button" className="flex-1" onClick={analyze} disabled={text.trim() === ''}>
                  <Wand2 className="size-4" /> 読み取る
                </Button>
              </div>
            </div>

            {items && items.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="size-4 text-primary" />
                  読み取り結果 {items.length}件
                  <span className="text-xs font-normal text-muted-foreground">
                    （直せます）
                  </span>
                </p>

                {items.map((item, index) => (
                  <div key={index} className="space-y-1.5 rounded-xl border p-2.5">
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(index, { name: e.target.value })}
                        className="h-9 flex-1"
                        aria-label="食材名"
                      />
                      <Input
                        defaultValue={formatQuantity(item.quantity)}
                        onBlur={(e) => {
                          const q = parseQuantity(e.target.value);
                          if (q !== null) updateItem(index, { quantity: q });
                        }}
                        className="h-9 w-14 text-center"
                        aria-label="数量"
                      />
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(index, { unit: e.target.value })}
                        className="h-9 w-16"
                        aria-label="単位"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground"
                        onClick={() => removeItem(index)}
                        aria-label="この食材を消す"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="secondary" className="font-normal">
                        {getCategoryLabel(item.categoryId)}
                      </Badge>
                      <Badge variant="secondary" className="font-normal">
                        {getStorageLocationLabel(item.storageLocationId)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DrawerFooter className="shrink-0 border-t bg-background px-4">
            <Button onClick={save} disabled={!items || items.length === 0 || isPending}>
              {isPending ? (
                <LoadingSpinner className="text-primary-foreground" />
              ) : (
                `${items?.length ?? 0}件をまとめて登録`
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button">
                キャンセル
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
