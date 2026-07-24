'use client';

import { useEffect, useState, useTransition } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import {
  RecipeSuggestionCard,
  RecipeSuggestionSkeletonList,
} from '@/features/recipes/components/recipe-suggestion-card';
import { browseRecipesAction } from '@/features/recipes/actions';
import type { RecipeSuggestion } from '@/lib/ai/types';

type BrowseResult = { missingCount: number; recipe: RecipeSuggestion };

// よく使う代表的なタグだけを絞り込みチップに出す。
const TAG_CHIPS = ['背徳飯', '和食', '洋食', '中華', '韓国', '主菜', '副菜', '鍋', '麺', '丼', 'デザート'];

export function BrowsePanel({ totalCount }: { totalCount: number }) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [results, setResults] = useState<BrowseResult[] | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        const result = await browseRecipesAction({ query, tag: tag ?? undefined });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        setResults(result.data);
      });
    }, 250);
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

      {isPending && !results && <RecipeSuggestionSkeletonList />}

      {results && results.length > 0 && (
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
      )}

      {results && results.length === 0 && (
        <EmptyState icon={BookOpen} title="該当するレシピが見つかりませんでした" />
      )}
    </div>
  );
}
