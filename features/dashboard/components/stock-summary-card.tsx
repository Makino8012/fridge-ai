import { AlertTriangle, Clock, Refrigerator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Refrigerator;
  label: string;
  value: number;
  tone: 'default' | 'warning' | 'destructive';
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col gap-2 p-4">
        <div
          className={cn(
            'flex size-9 items-center justify-center rounded-xl',
            tone === 'destructive' && 'bg-destructive/15 text-destructive',
            tone === 'warning' && 'bg-warning/15 text-warning-foreground dark:text-warning',
            tone === 'default' && 'bg-accent text-accent-foreground',
          )}
        >
          <Icon className="size-4.5" strokeWidth={1.75} />
        </div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export function StockSummaryCards({
  totalCount,
  expiredCount,
  expiringSoonCount,
}: {
  totalCount: number;
  expiredCount: number;
  expiringSoonCount: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard icon={Refrigerator} label="登録食材数" value={totalCount} tone="default" />
      <StatCard icon={Clock} label="期限間近" value={expiringSoonCount} tone="warning" />
      <StatCard icon={AlertTriangle} label="期限切れ" value={expiredCount} tone="destructive" />
    </div>
  );
}
