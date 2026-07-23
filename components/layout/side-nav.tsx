'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, Home, Refrigerator, Settings, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'ダッシュボード', icon: Home },
  { href: '/ingredients', label: '在庫一覧', icon: Refrigerator },
  { href: '/recipes', label: 'レシピ提案', icon: ChefHat },
  { href: '/shopping-list', label: '買い物リスト', icon: ShoppingCart },
  { href: '/settings', label: '設定', icon: Settings },
] as const;

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r px-3 py-6 md:flex">
      <div className="mb-4 px-3 text-lg font-semibold">冷蔵庫AI</div>
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
