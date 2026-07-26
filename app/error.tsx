'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * サーバー側で例外が起きたときの画面。
 *
 * これが無いと Vercel の素っ気ないエラー画面が出るだけで、
 * 何が起きたのかも、どうすれば直るのかも分からない。
 * 少なくとも再読み込みと初期設定への導線は残す。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-semibold">うまく読み込めませんでした</h1>
      <p className="text-sm text-muted-foreground">
        通信が不安定だったか、設定が終わっていない可能性があります。
      </p>

      <div className="flex flex-col gap-2">
        <Button onClick={reset}>
          <RefreshCw className="size-4" />
          もう一度読み込む
        </Button>
        <Button variant="outline" asChild>
          <a href="/onboarding">初期設定をやり直す</a>
        </Button>
      </div>

      {error.digest && (
        <p className="text-xs text-muted-foreground">エラーID: {error.digest}</p>
      )}
    </div>
  );
}
