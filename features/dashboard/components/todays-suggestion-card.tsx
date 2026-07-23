import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WasteReductionOutput } from '@/lib/ai/types';

const DIFFICULTY_LABEL: Record<string, string> = { easy: '簡単', normal: '普通', hard: '本格的' };

export function TodaysSuggestionCard({
  suggestion,
  aiUnavailable,
}: {
  suggestion: WasteReductionOutput | null;
  aiUnavailable?: boolean;
}) {
  if (aiUnavailable) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground">
          AIのおすすめを表示するには、ANTHROPIC_API_KEYを設定してください。
        </CardContent>
      </Card>
    );
  }

  if (!suggestion) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground">
          賞味期限が近い食材はありません。今日も食材は万全です。
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-accent/60 to-transparent">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground">
          <Sparkles className="size-4" />
          今日使うべき食材
        </div>
        <p className="text-sm">{suggestion.message}</p>
        <div className="flex items-center gap-2">
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
