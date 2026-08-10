'use server';

import { createClient } from '@/utils/supabase/server';
import { getActiveProfile } from '@/app/profiles/actions';
import { revalidatePath } from 'next/cache';

export async function toggleFavorite(movieId) {
  const supabase = await createClient();
  const profile = await getActiveProfile();

  if (!profile) {
    return { error: 'You must select a profile to save movies.' };
  }

  // Check if it exists
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('movie_id', movieId)
    .single();

  if (existing) {
    // Remove it
    await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);
  } else {
    // Add it
    await supabase
      .from('favorites')
      .insert([
        { user_id: profile.user_id, profile_id: profile.id, movie_id: movieId }
      ]);
  }

  revalidatePath(`/movie/${movieId}`);
  revalidatePath('/my-list');
  return { success: true, isFavorite: !existing };
}

