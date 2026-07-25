import { Header } from '@/components/layout/header';
import { StockSummaryCards } from '@/features/dashboard/components/stock-summary-card';
import { StockCheckCard } from '@/features/dashboard/components/stock-check-card';
import { TonightCard } from '@/features/dashboard/components/tonight-card';
import { ExpiringStrip } from '@/features/dashboard/components/expiring-strip';
import {
  getDashboardSummary,
  getStockCheckItems,
  getTonightPicks,
} from '@/services/dashboard/dashboard-service';

export default async function DashboardPage() {
  const [summary, picks, stockCheckItems] = await Promise.all([
    getDashboardSummary(),
    getTonightPicks(),
    getStockCheckItems(),
  ]);

  return (
    <>
      <Header title="今日何食べる?" />
      <div className="space-y-5 px-4 md:px-0">
        {/* 献立の提案を最上部に置き、開いてすぐ決められるようにする */}
        <TonightCard picks={picks} />

        <ExpiringStrip items={picks.expiring} />

        {/* 在庫のズレを少しずつ直す。提案の精度はここに依存している */}
        <StockCheckCard items={stockCheckItems} />

        <StockSummaryCards
          totalCount={summary.totalCount}
          expiredCount={summary.expiredCount}
          expiringSoonCount={summary.expiringSoonCount}
        />
      </div>
    </>
  );
}
