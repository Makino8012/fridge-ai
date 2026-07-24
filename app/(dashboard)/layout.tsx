import { redirect } from 'next/navigation';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SideNav } from '@/components/layout/side-nav';
import { Brand } from '@/components/layout/brand';
import { getCurrentProfile } from '@/services/household/household-service';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.household_id) {
    redirect('/onboarding');
  }

  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* モバイルではサイドナビが出ないので、上部にブランドバーを表示 */}
        <div className="flex items-center px-4 pt-3 md:hidden">
          <Brand />
        </div>
        <main className="container max-w-4xl flex-1 space-y-6 pb-24 pt-3 md:pb-10 md:pt-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
