'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import crypto from 'crypto'

export async function migrateUser(prevState, formData) {
  try {
    const supabase = await createClient()
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('email', user.email)
      .single()

    if (profile?.role !== 'administrator' && profile?.role !== 'editor') {
      return { error: 'Unauthorized' }
    }

    const email = formData.get('email')?.trim()
    const username = formData.get('username')?.trim()
    const daysLeft = parseInt(formData.get('daysLeft'), 10) || 0

    if (!email || !username) {
      return { error: 'Email and Username are required' }
    }

    const adminClient = createAdminClient()

    // 1. Create User in Supabase Auth
    // The user will reset this password, so we make it completely random and complex
    const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!'
    
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true, // We auto-confirm so they don't have to click a verify link first
      user_metadata: { name: username }
    })

    if (createError) {
      if (createError.message.includes('already registered')) {
        return { error: 'A user with this email already exists in the new system.' }
      }
      return { error: `Failed to create user: ${createError.message}` }
    }

    const userId = newUser.user.id

    // 2. Wait a moment to ensure any auth triggers have completed creating the profile
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 3. Calculate new subscription end date
    let subscriptionEndDate = null
    if (daysLeft > 0) {
      const d = new Date()
      d.setDate(d.getDate() + daysLeft)
      subscriptionEndDate = d.toISOString()
    }

    // 4. Update the user_profiles table (using upsert in case the trigger failed/was slow)
    const { error: updateError } = await adminClient
      .from('user_profiles')
      .upsert({
        id: userId,
        email: email,
        username: username,
        role: 'user',
        subscription_end_date: subscriptionEndDate,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Even if this fails, they are in Auth. So we warn the admin but it's technically a partial success.
      return { error: 'User created in Auth, but failed to apply subscription days.' }
    }

    return { success: true, message: `Successfully migrated ${username} (${email}). They can now use the "Forgot Password" option to log in.` }

  } catch (err) {
    console.error('Migration error:', err)
    return { error: 'An unexpected error occurred during migration.' }
  }
}
