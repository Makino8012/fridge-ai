import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExpiringItem } from '@/services/dashboard/dashboard-service';

/** 期限が近い食材を目立つ位置に出して、使い切りを促す。 */
export function ExpiringStrip({ items }: { items: ExpiringItem[] }) {
  if (items.length === 0) return null;

  return (
    <Link href="/recipes" className="block">
      <Card className="rounded-2xl border-warning/40 bg-warning/10">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertTriangle className="size-5 shrink-0 text-warning-foreground dark:text-warning" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium">早めに使いたい食材が{items.length}件</p>
            <div className="flex flex-wrap gap-1.5">
              {items.slice(0, 4).map((item) => (
                <Badge key={item.name} variant="outline" className="bg-background/60 font-normal">
                  {item.name}・{item.label}
                </Badge>
              ))}
              {items.length > 4 && (
                <Badge variant="outline" className="bg-background/60 font-normal">
                  ほか{items.length - 4}件
                </Badge>
              )}
            </div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
