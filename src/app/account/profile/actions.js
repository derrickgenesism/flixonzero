'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const username = formData.get('username');

  if (username && username.trim().length > 0) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ username: username.trim() })
      .eq('email', user.email);

    if (error) {
      console.error('Error updating profile:', error);
      return { error: error.message };
    }
  }

  revalidatePath('/account');
  revalidatePath('/account/profile');

  return { success: true };
}
