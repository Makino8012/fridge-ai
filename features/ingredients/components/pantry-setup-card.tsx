'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Soup } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { createIngredientsBulk } from '@/features/ingredients/actions';
import { guessCategory, guessStorage, guessUnit } from '@/lib/ingredient-guess';
import { cn } from '@/lib/utils';

/**
 * よく使う調味料をまとめて在庫に入れるためのカード。
 *
 * 塩や醤油のような基礎調味料は持っている前提で扱うが、
 * 鶏がらスープの素やナンプラーは家庭によって無い。無い物を持っている事にすると
 * 「作れます」と言われて作れないので、これらは在庫を見るようにした。
 * そのぶん最初の登録が面倒になるため、ここでまとめて登録できるようにしている。
 */

/** レシピ辞書での使用頻度が高い順。かっこ内の数字は登場するレシピ数の目安。 */
const PANTRY_ITEMS = [
  '鶏がらスープの素',
  'にんにく',
  'コンソメ',
  '生姜',
  'オイスターソース',
  'パン粉',
  'ポン酢',
  'めんつゆ',
  'すりごま',
  '白ごま',
  'コチュジャン',
  'カレー粉',
  '粉チーズ',
  'はちみつ',
  'わさび',
  'ラー油',
  '豆板醤',
  '唐辛子',
  'ナンプラー',
  '青のり',
  '練りごま',
  '塩昆布',
  'かつお節',
  'ウスターソース',
  'レモン汁',
  '粒マスタード',
  '白だし',
  '焼肉のタレ',
];

export function PantrySetupCard({ existingNames }: { existingNames: string[] }) {
  const owned = new Set(existingNames);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const candidates = PANTRY_ITEMS.filter((name) => !owned.has(name));
  if (candidates.length === 0) return null;

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function register() {
    const names = [...selected];
    if (names.length === 0) return;

    startTransition(async () => {
      const category = (name: string) => guessCategory(name) ?? 'seasoning';
      const result = await createIngredientsBulk(
        names.map((name) => ({
          name,
          quantity: 1,
          unit: guessUnit(name) ?? '本',
          categoryId: category(name),
          storageLocationId: guessStorage(category(name), name) ?? 'fridge',
          expiryDate: null,
          memo: null,
        })),
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${names.length}件を在庫に追加しました`);
      setSelected(new Set());
    });
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Soup className="size-4.5" strokeWidth={1.75} />
        </div>
        <CardTitle className="text-base">常備している調味料</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          家にある物を選んで登録すると、それを使うレシピが「作れる」に出るようになります。
          塩・砂糖・醤油などの基礎調味料は登録しなくても持っている前提で扱います。
        </p>

        <div className="flex flex-wrap gap-1.5">
          {candidates.map((name) => (
            <Button
              key={name}
              type="button"
              variant={selected.has(name) ? 'default' : 'outline'}
              size="sm"
              className={cn('h-8 rounded-full px-3 text-xs font-normal')}
              onClick={() => toggle(name)}
              aria-pressed={selected.has(name)}
            >
              {name}
            </Button>
          ))}
        </div>

        <Button className="w-full" onClick={register} disabled={selected.size === 0 || isPending}>
          {isPending ? <LoadingSpinner className="text-primary-foreground" /> : null}
          選んだ{selected.size}件を在庫に追加
        </Button>
      </CardContent>
    </Card>
  );
}
