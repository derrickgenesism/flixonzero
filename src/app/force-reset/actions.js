'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export async function forcePasswordReset(formData) {
  const email = formData.get('email')
  const password = formData.get('password')

  // We must use the Service Role Key to bypass the old password requirement
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  let authUser = null;
  let page = 1;
  const normalizedEmail = email.trim().toLowerCase();
  
  while (!authUser) {
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    if (listError || users.length === 0) break;
    authUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
    page++;
  }

  // If the user doesn't exist in auth.users, they need to be recreated!
  if (!authUser) {
    // Check if they exist in user_profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .ilike('email', normalizedEmail)
      .limit(1)
      .maybeSingle()

    if (profileError) {
      return { error: 'Database error while checking profile: ' + profileError.message }
    }

    if (!profile) {
      return { error: `Account (${normalizedEmail}) truly not found in user_profiles.` }
    }

    // Recreate them in auth.users with the exact same ID so it links to their profile
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      id: profile.id,
      email: normalizedEmail,
      password: password,
      email_confirm: true
    })

    if (createError) {
      // If the ID already exists or something else failed
      return { error: 'Failed to restore account: ' + createError.message }
    }
    authUser = newUserData.user;
  } else {
    // Force update the password for existing authUser
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: password }
    )
    if (updateError) return { error: updateError.message }
  }

  // 3. Try to update user_profiles legacy_migration flag (but don't fail if they don't have a profile yet)
  await supabaseAdmin
    .from('user_profiles')
    .update({ legacy_migration: false })
    .ilike('email', normalizedEmail)

  // 5. Log them in properly with the standard client
  const supabase = await createServerClient()
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (loginError) {
    return { error: 'Password updated, but login failed: ' + loginError.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
