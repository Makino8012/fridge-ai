import { Users } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InviteLinkCard } from '@/features/household/components/invite-link-card';
import { DietaryPreferencesForm } from '@/features/household/components/dietary-preferences-form';
import { ChangelogCard } from '@/features/household/components/changelog-card';
import { APP_VERSION } from '@/data/changelog';
import {
  getCurrentHouseholdId,
  getCurrentProfile,
  getHousehold,
  getHouseholdMembers,
} from '@/services/household/household-service';

export default async function SettingsPage() {
  const householdId = await getCurrentHouseholdId();
  const [household, profile, members] = await Promise.all([
    getHousehold(householdId),
    getCurrentProfile(),
    getHouseholdMembers(householdId),
  ]);

  return (
    <>
      <Header title="設定" />
      <div className="space-y-6 px-4 md:px-0">
        <Card className="rounded-2xl">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Users className="size-4.5" strokeWidth={1.75} />
            </div>
            <CardTitle className="text-base">{household.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {members.map((m) => (
                <li key={m.id}>
                  {m.display_name || '(名前未設定)'} {m.id === profile?.id && '(あなた)'}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <InviteLinkCard inviteToken={household.invite_token} />

        {profile && <DietaryPreferencesForm initialPreferences={profile.dietary_preferences} />}

        <ChangelogCard />

        <p className="pb-2 text-center text-xs text-muted-foreground">Kukku v{APP_VERSION}</p>
      </div>
    </>
  );
}
