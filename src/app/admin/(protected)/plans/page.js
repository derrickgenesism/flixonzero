import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import PlansClient from './PlansClient';

export default async function AdminPlansPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator') {
    return (
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Access Denied</h1>
        <p style={{ color: 'var(--text2)' }}>You do not have permission to manage plans.</p>
      </div>
    );
  }

  // Gracefully fetch plans (in case table not created yet)
  const { data: plans, error } = await supabase.from('subscription_plans').select('*').order('created_at', { ascending: true });

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>Manage Subscription Plans</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>
        Create dynamic pricing plans. These will automatically appear on the checkout page.
      </p>

      {error ? (
        <div style={{ background: 'rgba(229, 9, 20, 0.1)', color: '#e50914', padding: '15px', borderRadius: '6px' }}>
          Please run the `plans_setup.sql` script in your Supabase dashboard to enable this feature.
        </div>
      ) : (
        <PlansClient initialPlans={plans || []} />
      )}
    </div>
  );
}
