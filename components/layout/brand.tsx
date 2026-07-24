import { cn } from '@/lib/utils';

// Kukkuのロゴマーク。アプリアイコン(オレンジの角丸に冷蔵庫)と揃えたインラインSVG。
export function KukkuLogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label="Kukku">
      <rect width="512" height="512" rx="120" fill="hsl(var(--primary))" />
      <rect x="150" y="104" width="212" height="304" rx="30" fill="white" />
      <line x1="150" y1="214" x2="362" y2="214" stroke="hsl(var(--primary))" strokeWidth="10" />
      <rect x="176" y="140" width="11" height="40" rx="5.5" fill="hsl(var(--primary))" />
      <rect x="176" y="240" width="11" height="40" rx="5.5" fill="hsl(var(--primary))" />
    </svg>
  );
}

// ロゴマーク + ワードマーク。モバイル画面上部のブランドバーなどに使う。
export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <KukkuLogoMark className="size-7 rounded-[7px]" />
      <span className="text-lg font-bold tracking-tight">Kukku</span>
    </div>
  );
}
