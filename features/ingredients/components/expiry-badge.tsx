import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatExpiryLabel, getExpiryStatus } from '@/lib/date';
import { effectiveExpiry, type ShelfLifeInput } from '@/lib/shelf-life';

const STATUS_STYLE: Record<string, string> = {
  expired: 'bg-destructive/15 text-destructive border-destructive/20',
  soon: 'bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning',
  ok: 'bg-muted text-muted-foreground border-transparent',
  none: 'bg-transparent text-muted-foreground border-transparent',
};

/**
 * 期限が未入力なら「期限なし」ではなく、食材の種類からの目安を出す。
 * 「期限なし」とだけ書かれていても何の判断材料にもならないため。
 * 推定は控えめな見た目にして、入力された期限と区別できるようにする。
 */
export function ExpiryBadge({ item }: { item: ShelfLifeInput }) {
  const expiry = effectiveExpiry(item);
  if (!expiry) {
    return (
      <Badge variant="outline" className={cn('font-normal tabular-nums', STATUS_STYLE.none)}>
        期限なし
      </Badge>
    );
  }

  const status = getExpiryStatus(expiry.date);
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-normal tabular-nums',
        STATUS_STYLE[expiry.estimated && status === 'ok' ? 'none' : status],
      )}
    >
      {expiry.estimated && <span className="mr-1 opacity-60">目安</span>}
      {formatExpiryLabel(expiry.date)}
    </Badge>
  );
}
