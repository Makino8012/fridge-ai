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
      <CardContent className="flex flex-col gap-1.5 p-3.5">
        <div
          className={cn(
            'flex size-8 items-center justify-center rounded-lg',
            tone === 'destructive' && 'bg-destructive/15 text-destructive',
            tone === 'warning' && 'bg-warning/15 text-warning-foreground dark:text-warning',
            tone === 'default' && 'bg-accent text-accent-foreground',
          )}
        >
          <Icon className="size-4" strokeWidth={2} />
        </div>
        <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
        <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
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
