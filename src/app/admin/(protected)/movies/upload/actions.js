'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function queueCompressionJob(videoKey) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator' && profile?.role !== 'editor') {
    return { error: 'Not authorized' };
  }

  const { error } = await supabase
    .from('compression_jobs')
    .insert({ video_key: videoKey, status: 'pending', progress: 0 });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/movies/upload');
  return { success: true };
}
