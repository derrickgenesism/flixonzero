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

  // 1. Find the user ID by email via the user_profiles table (since auth.users is protected)
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('id, legacy_migration')
    .eq('email', email)
    .single()

  if (!profile) {
    return { error: 'Account not found.' }
  }

  // 2. We need the auth.users UUID to update the password.
  // We can query auth.users directly with the admin client.
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) return { error: listError.message }

  const authUser = users.find(u => u.email === email)
  if (!authUser) return { error: 'Auth user not found.' }

  // 3. Force update the password!
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    authUser.id,
    { password: password }
  )

  if (updateError) return { error: updateError.message }

  // 4. Mark legacy_migration as false so this backdoor is closed forever for this user
  await supabaseAdmin
    .from('user_profiles')
    .update({ legacy_migration: false })
    .eq('email', email)

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
