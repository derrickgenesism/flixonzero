'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers';

export async function sendResetEmail(formData) {
  const email = formData.get('email');
  const supabase = await createClient();

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const siteUrl = `${protocol}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/update-password`,
  });

  if (error) {
    // Ideally we would show the error on the UI instead of redirecting with error parameter,
    // but for simplicity we can redirect with a query param
    redirect(`/reset-password?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?message=Check your email for the password reset link.')
}
