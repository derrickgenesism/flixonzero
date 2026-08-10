'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(profileId, newRole) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if current user is an administrator
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single()

  if (currentProfile?.role !== 'administrator') {
    return { error: 'Only administrators can change roles.' }
  }

  // Update the target user's role
  const { error } = await supabase
    .from('user_profiles')
    .update({ role: newRole })
    .eq('id', profileId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function addNewUser(formData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if current user is an administrator
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single()

  if (currentProfile?.role !== 'administrator') {
    return { error: 'Only administrators can add users.' }
  }

  const email = formData.get('email').trim()
  const password = formData.get('password')
  const role = formData.get('role')

  // Since createClient from utils/supabase/server is custom, we must import standard @supabase/supabase-js for the admin task
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Create user in Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError) {
    return { error: authError.message }
  }

  // The database trigger we added in roles_setup.sql will automatically 
  // insert the user into user_profiles with role='user'.
  // We need to wait a tiny bit to ensure the trigger completes, then update the role.
  await new Promise(r => setTimeout(r, 500))

  const { error: roleError } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('email', email)

  if (roleError) {
    // Note: User was created in auth but role couldn't be updated.
    console.error("Error setting role for new user:", roleError)
  }

  revalidatePath('/admin/users')
  return { success: true }
}
