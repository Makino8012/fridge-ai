'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { RecipeSuggestionCard } from '@/features/recipes/components/recipe-suggestion-card';
import { browseRecipesAction } from '@/features/recipes/actions';
import type { RecipeSuggestion } from '@/lib/ai/types';

type BrowseResult = { missingCount: number; recipe: RecipeSuggestion };

// よく使う代表的なタグだけを絞り込みチップに出す。
const TAG_CHIPS = ['背徳飯', '和食', '洋食', '中華', '韓国', '主菜', '副菜', '鍋', '麺', '丼', 'デザート'];

export function BrowsePanel({
  totalCount,
  initialResults,
}: {
  totalCount: number;
  initialResults: BrowseResult[];
}) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [results, setResults] = useState<BrowseResult[]>(initialResults);
  const [isPending, startTransition] = useTransition();

  // 初回(絞り込みなし)はサーバーから渡された初期結果をそのまま使い、余分な通信をしない。
  const isFirstRun = useRef(true);
  const lastQuery = useRef(query);

  useEffect(() => {
    const queryChanged = lastQuery.current !== query;
    lastQuery.current = query;

    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (query === '' && tag === null) return; // 初期結果を使う
    }

    // 文字入力はデバウンス、タグ切替は即時に反映して素早く切り替わるようにする。
    const delay = queryChanged ? 200 : 0;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const result = await browseRecipesAction({ query, tag: tag ?? undefined });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        setResults(result.data);
      });
    }, delay);
    return () => clearTimeout(handle);
  }, [query, tag]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`全${totalCount}品から検索(料理名・食材・ジャンル）`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <Badge
          variant={tag === null ? 'default' : 'outline'}
          className="shrink-0 cursor-pointer font-normal"
          onClick={() => setTag(null)}
        >
          すべて
        </Badge>
        {TAG_CHIPS.map((t) => (
          <Badge
            key={t}
            variant={tag === t ? 'default' : 'outline'}
            className="shrink-0 cursor-pointer font-normal"
            onClick={() => setTag((cur) => (cur === t ? null : t))}
          >
            {t}
          </Badge>
        ))}
      </div>

      <div className="relative min-h-24">
        {/* 切り替え中は結果を薄くして、くるくる(ローディング)を重ねて表示する。 */}
        {isPending && (
          <div className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center">
            <span className="rounded-full bg-background/90 p-2 shadow-sm">
              <LoadingSpinner />
            </span>
          </div>
        )}

        <div className={isPending ? 'pointer-events-none opacity-40 transition-opacity' : 'transition-opacity'}>
          {results.length > 0 ? (
            <div className="space-y-2.5">
              {results.map((r, i) => (
                <div key={i} className="space-y-1.5">
                  {r.missingCount === 0 && (
                    <Badge variant="outline" className="border-success/40 font-normal text-success">
                      今の在庫で作れる
                    </Badge>
                  )}
                  <RecipeSuggestionCard recipe={r.recipe} />
                </div>
              ))}
            </div>
          ) : (
            !isPending && <EmptyState icon={BookOpen} title="該当するレシピが見つかりませんでした" />
          )}
        </div>
      </div>
    </div>
  );
}
