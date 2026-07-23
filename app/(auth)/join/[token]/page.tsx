import { JoinForm } from '@/features/household/components/join-form';

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <JoinForm inviteToken={token} />;
}
