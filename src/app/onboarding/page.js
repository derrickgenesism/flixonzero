import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingClient from './OnboardingClient';

export const metadata = { title: 'Welcome to Flixon!' };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_done')
    .eq('email', user.email)
    .single();

  if (profile?.onboarding_done) redirect('/');

  return <OnboardingClient />;
}
