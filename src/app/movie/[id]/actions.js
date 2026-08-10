'use server';

import { createClient } from '@/utils/supabase/server';
import { getActiveProfile } from '@/app/profiles/actions';

export async function saveWatchProgress(movieId, progressSeconds) {
  const supabase = await createClient();
  const profile = await getActiveProfile();

  if (!profile) return; // Ignore if not logged in / no profile

  const { error } = await supabase
    .from('watch_history')
    .upsert({
      user_id: profile.user_id, // keep user_id just in case
      profile_id: profile.id,
      movie_id: movieId,
      progress_seconds: progressSeconds,
      updated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,movie_id' }); // Note: We need this unique constraint in the DB

  if (error) {
    console.error("Failed to save progress:", error);
  }
}

