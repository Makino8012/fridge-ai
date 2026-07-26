import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * メールのリンクから戻ってきたときの受け口。
 *
 * 匿名セッションはブラウザのデータが消えると復元できず、
 * 「最初からになった」という事故が起きる。メールでログインできるようにして、
 * 端末を変えても同じ在庫に戻れるようにするための入り口。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/onboarding?error=link_invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // 期限切れや使用済みのリンクを踏んだ場合。文言は遷移先で出す。
    return NextResponse.redirect(`${origin}/onboarding?error=link_expired`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
