'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { KeyRound, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { createClient } from '@/lib/supabase/client';

/**
 * 今のアカウントにメールアドレスを結びつけるカード。
 *
 * このアプリはログイン画面を挟まないぶん、アカウントがブラウザの中にしか無い。
 * iOSはしばらく開かないサイトの保存データを消すので、それだけで
 * 「最初からになった」状態になり、しかも戻す手段が無い。
 * メールを登録しておけば、端末を変えても同じ在庫に戻れる。
 */
export function AccountLinkCard({ currentEmail }: { currentEmail: string | null }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const value = email.trim();
    if (!value) {
      toast.error('メールアドレスを入力してください');
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser(
        { email: value },
        { emailRedirectTo: `${window.location.origin}/auth/callback` },
      );
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
    });
  }

  if (currentEmail) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <MailCheck className="size-4.5" strokeWidth={1.75} />
          </div>
          <CardTitle className="text-base">引き継ぎ設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm">{currentEmail}</p>
          <p className="text-xs text-muted-foreground">
            機種変更や、アプリのデータが消えたときは、このアドレス宛のログインリンクから元の在庫に戻れます。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-warning/40 bg-warning/5">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <KeyRound className="size-4.5" strokeWidth={1.75} />
        </div>
        <CardTitle className="text-base">引き継ぎ設定(未設定)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          今のアカウントはこの端末のブラウザの中にしかありません。
          データが消えると元に戻せないので、メールアドレスを登録しておいてください。
          パスワードは不要で、次からはメールのリンクで入れます。
        </p>

        {sent ? (
          <p className="text-sm">
            確認メールを送りました。メール内のリンクを開くと登録が完了します。
          </p>
        ) : (
          <div className="flex gap-2">
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <Button onClick={handleSubmit} disabled={isPending} className="shrink-0">
              {isPending ? <LoadingSpinner className="text-primary-foreground" /> : '登録'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
