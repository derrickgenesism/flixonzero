'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function adminLogin(formData) {
  const supabase = await createClient()

  const email = formData.get('email').trim()
  const password = formData.get('password')

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return { error: error.message }
  }

  // Check if they are actually an admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', data.user.email)
    .single()

  if (profile?.role !== 'administrator' && profile?.role !== 'editor') {
    // If not admin, sign them out and reject
    await supabase.auth.signOut()
    return { error: 'Access denied. You do not have admin privileges.' }
  }

  redirect('/admin/tmdb')
}
