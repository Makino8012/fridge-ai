'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { fetchTodaysSuggestion } from '@/features/dashboard/actions';
import type { WasteReductionOutput } from '@/lib/ai/types';

const DIFFICULTY_LABEL: Record<string, string> = { easy: '簡単', normal: '普通', hard: '本格的' };

export function TodaysSuggestionCard() {
  const [suggestion, setSuggestion] = useState<WasteReductionOutput | null>(null);
  const [fetched, setFetched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleFetch() {
    startTransition(async () => {
      const result = await fetchTodaysSuggestion();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSuggestion(result.data);
      setFetched(true);
    });
  }

  if (!fetched) {
    return (
      <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-accent/50 to-transparent">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">今日使うべき食材をAIに聞く</p>
            <p className="text-xs text-muted-foreground">
              賞味期限が近い食材を優先したおすすめ料理を提案します
            </p>
          </div>
          <Button onClick={handleFetch} disabled={isPending} className="rounded-full">
            {isPending ? <LoadingSpinner className="text-primary-foreground" /> : 'おすすめを見る'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!suggestion) {
    return (
      <Card className="rounded-3xl border-dashed">
        <CardContent className="flex items-center justify-between gap-3 p-5 text-sm text-muted-foreground">
          賞味期限が近い食材はありません。今日も食材は万全です。
          <Button variant="ghost" size="sm" onClick={handleFetch} disabled={isPending} className="shrink-0">
            再取得
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-accent/50 to-transparent">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" />
          今日使うべき食材
        </div>
        <p className="text-sm">{suggestion.message}</p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{suggestion.recipe.title}</p>
          <Badge variant="outline" className="font-normal">
            {DIFFICULTY_LABEL[suggestion.recipe.difficulty]}
          </Badge>
          <Badge variant="outline" className="font-normal">
            {suggestion.recipe.cookingTimeMinutes}分
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
