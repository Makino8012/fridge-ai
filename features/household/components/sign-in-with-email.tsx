'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { createClient } from '@/lib/supabase/client';

/**
 * 以前使っていたアカウントに戻るための入り口。
 *
 * 初期設定画面をそのまま進めると新しい「わが家」ができてしまい、
 * 前の在庫と切り離される。既にメールを登録している人はここから戻る。
 */
export function SignInWithEmail() {
  const [open, setOpen] = useState(false);
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
      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          // 登録の無いアドレスで新しいアカウントを作らない。
          // ここは「戻る」ための導線なので、作ってしまうと元の在庫から離れる。
          shouldCreateUser: false,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        ログイン用のリンクをメールで送りました。同じ端末でリンクを開いてください。
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="text-center text-sm text-muted-foreground underline underline-offset-4"
        onClick={() => setOpen(true)}
      >
        以前このアプリを使っていた方はこちら
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        登録済みのメールアドレスにログイン用のリンクを送ります。
      </p>
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
        <Button variant="outline" onClick={handleSubmit} disabled={isPending} className="shrink-0">
          {isPending ? <LoadingSpinner /> : '送信'}
        </Button>
      </div>
    </div>
  );
}
