import Navbar from '@/components/Navbar';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Sign In — Flixon',
  description: 'Sign in to your Flixon account and start streaming premium movies and series.',
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const refCode = params?.ref || '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="flx-login-page">
        <LoginForm refCode={refCode} />
      </div>
    </div>
  );
}
