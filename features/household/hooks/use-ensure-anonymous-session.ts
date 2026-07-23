'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * 招待URL/オンボーディング画面で、ログイン画面を見せずに
 * Supabaseの匿名認証セッションを確保するためのフック。
 * 既にセッションがあれば何もしない。
 */
export function useEnsureAnonymousSession() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function ensureSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
          if (!cancelled) setError('セッションの開始に失敗しました');
          return;
        }
      }

      if (!cancelled) setReady(true);
    }

    ensureSession();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}
