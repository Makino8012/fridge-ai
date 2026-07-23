import { Header } from '@/components/layout/header';
import { StockSummaryCards } from '@/features/dashboard/components/stock-summary-card';
import { TodaysSuggestionCard } from '@/features/dashboard/components/todays-suggestion-card';
import { getDashboardSummary, getTodaysSuggestion } from '@/services/dashboard/dashboard-service';
import type { WasteReductionOutput } from '@/lib/ai/types';

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  let suggestion: WasteReductionOutput | null = null;
  let aiUnavailable = false;
  try {
    suggestion = await getTodaysSuggestion();
  } catch {
    aiUnavailable = true;
  }

  return (
    <>
      <Header title="ダッシュボード" />
      <div className="space-y-6 px-4 md:px-0">
        <StockSummaryCards
          totalCount={summary.totalCount}
          expiredCount={summary.expiredCount}
          expiringSoonCount={summary.expiringSoonCount}
        />
        <TodaysSuggestionCard suggestion={suggestion} aiUnavailable={aiUnavailable} />
      </div>
    </>
  );
}
