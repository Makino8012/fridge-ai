'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * 世帯内リアルタイム共有用の汎用フック。
 * 対象テーブルのINSERT/UPDATE/DELETEを検知したら router.refresh() でServer Componentの
 * データを再取得する(手元での楽観的マージはせず、常にDBを正としてシンプルに保つ)。
 */
export function useRealtimeTableRefresh(table: 'ingredients' | 'shopping_list_items', householdId: string) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`realtime:${table}:${householdId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `household_id=eq.${householdId}` },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => router.refresh(), 300);
        },
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [table, householdId, router]);
}
