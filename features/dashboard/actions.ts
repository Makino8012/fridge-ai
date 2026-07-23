'use server';

import { actionError, actionSuccess, type ActionResult } from '@/lib/action-result';
import { getTodaysSuggestion } from '@/services/dashboard/dashboard-service';
import type { WasteReductionOutput } from '@/lib/ai/types';

export async function fetchTodaysSuggestion(): Promise<ActionResult<WasteReductionOutput | null>> {
  try {
    const suggestion = await getTodaysSuggestion();
    return actionSuccess(suggestion);
  } catch {
    return actionError('おすすめの取得に失敗しました。しばらくしてから再度お試しください');
  }
}
