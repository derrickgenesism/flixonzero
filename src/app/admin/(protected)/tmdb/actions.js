'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateMovieWithTMDB(data) {
  const supabase = await createClient()

  // Ensure they are admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single()

  if (profile?.role !== 'administrator' && profile?.role !== 'editor') return { error: 'Not authorized' }

  // Update movie
  const { error } = await supabase
    .from('movies')
    .update({
      description: data.description,
      thumbnail_url: data.thumbnail_url,
      categories: data.categories
    })
    .eq('id', data.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/movie/${data.id}`)
  revalidatePath('/admin/tmdb')

  return { success: true }
}
