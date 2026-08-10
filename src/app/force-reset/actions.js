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

  // 1. Find the user in auth.users (paginated since listUsers defaults to 50)
  let authUser = null;
  let page = 1;
  const normalizedEmail = email.trim().toLowerCase();
  
  while (!authUser) {
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    if (listError || users.length === 0) break;
    authUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
    page++;
  }

  if (!authUser) {
    return { error: 'Account not found in our system.' }
  }

  // 2. Force update the password
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    authUser.id,
    { password: password }
  )

  if (updateError) return { error: updateError.message }

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
