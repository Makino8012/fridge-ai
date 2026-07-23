'use client';

import { useState, useTransition } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { regenerateInviteToken } from '@/features/household/actions';

export function InviteLinkCard({ inviteToken }: { inviteToken: string }) {
  const [token, setToken] = useState(inviteToken);
  const [isPending, startTransition] = useTransition();

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${token}` : `/join/${token}`;

  function handleCopy() {
    navigator.clipboard.writeText(inviteUrl);
    toast.success('招待URLをコピーしました');
  }

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateInviteToken();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setToken(result.data.inviteToken);
      toast.success('招待URLを再発行しました。古いURLは無効になりました');
    });
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">わが家の招待URL</CardTitle>
        <CardDescription>このURLを共有すると、ログインなしで同じ在庫を見られるようになります</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input readOnly value={inviteUrl} className="text-xs" />
          <Button variant="outline" size="icon" onClick={handleCopy} aria-label="コピー">
            <Copy className="size-4" />
          </Button>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isPending}>
              <RefreshCw className="size-3.5" /> URLを再発行する
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>招待URLを再発行しますか?</AlertDialogTitle>
              <AlertDialogDescription>
                古いURLは無効になります。既に参加しているメンバーのアクセスには影響しません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleRegenerate}>再発行する</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
