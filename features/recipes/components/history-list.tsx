import { History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate } from '@/lib/date';
import type { Database, RecipeRequestType } from '@/types/database.types';

type RecipeHistoryRow = Database['public']['Tables']['recipe_history']['Row'];

const REQUEST_TYPE_LABEL: Record<RecipeRequestType, string> = {
  recipe_suggest: '作れる料理の提案',
  missing_ingredients: 'あと1品で作れる提案',
  menu_plan: '献立提案',
  shopping_list: '買い物リスト提案',
  waste_reduction: '無駄なく使う提案',
};

export function HistoryList({ history }: { history: RecipeHistoryRow[] }) {
  if (history.length === 0) {
    return <EmptyState icon={History} title="AI提案の履歴はまだありません" />;
  }

  return (
    <div className="space-y-2.5">
      {history.map((item) => (
        <Card key={item.id} className="rounded-2xl">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm font-medium">{REQUEST_TYPE_LABEL[item.request_type]}</p>
            <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
