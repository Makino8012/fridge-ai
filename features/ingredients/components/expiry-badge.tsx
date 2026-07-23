import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatExpiryLabel, getExpiryStatus } from '@/lib/date';

const STATUS_STYLE: Record<string, string> = {
  expired: 'bg-destructive/15 text-destructive border-destructive/20',
  soon: 'bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning',
  ok: 'bg-muted text-muted-foreground border-transparent',
  none: 'bg-transparent text-muted-foreground border-transparent',
};

export function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  const status = getExpiryStatus(expiryDate);
  return (
    <Badge variant="outline" className={cn('font-normal tabular-nums', STATUS_STYLE[status])}>
      {formatExpiryLabel(expiryDate)}
    </Badge>
  );
}
