import Navbar from '@/components/Navbar';
import LoginForm from './LoginForm';
import { getCachedSettings } from '@/lib/cache';

export const metadata = {
  title: 'Sign In — Flixon',
  description: 'Sign in to your Flixon account and start streaming premium movies and series.',
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const refCode = params?.ref || '';
  const settings = await getCachedSettings();
  const googleAuthEnabled = settings?.find(s => s.setting_key === 'google_auth_enabled')?.setting_value === 'true';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="flx-login-page">
        <LoginForm refCode={refCode} googleAuthEnabled={googleAuthEnabled} />
      </div>
    </div>
  );
}
