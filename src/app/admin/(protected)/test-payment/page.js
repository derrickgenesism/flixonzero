import TestPaymentClient from './TestPaymentClient';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const metadata = {
  title: 'Test Payment Integration | Admin',
};

export default async function TestPaymentPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: settings } = await supabaseAdmin
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'flutterwave_public_key')
    .single();

  const publicKey = settings?.setting_value || '';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <TestPaymentClient 
        publicKey={publicKey} 
        userEmail={user?.email || 'test@example.com'} 
        userName={user?.email ? user.email.split('@')[0] : 'Test User'} 
      />
    </div>
  );
}
