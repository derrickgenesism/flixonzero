'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import crypto from 'crypto'

export async function migrateUser(prevState, formData) {
  try {
    const supabase = await createClient()
    
    // Auth check — must be admin
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

    // 1. Create User in Supabase Auth with a random password
    const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!'
    
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { name: username }
    })

    if (createError) {
      if (createError.message.includes('already registered')) {
        return { error: 'A user with this email already exists in the new system.' }
      }
      return { error: `Failed to create user: ${createError.message}` }
    }

    // 2. Wait for the database trigger to create the user_profiles row
    // (same pattern as the working addNewUser function)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 3. Calculate subscription end date
    let subscriptionEndDate = null
    if (daysLeft > 0) {
      const d = new Date()
      d.setDate(d.getDate() + daysLeft)
      subscriptionEndDate = d.toISOString()
    }

    // 4. Update the profile row that the trigger just created.
    // Match by email — exactly like the working addNewUser pattern.
    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({
        username: username,
        role: 'user',
        subscription_end_date: subscriptionEndDate,
      })
      .eq('email', email)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return { 
        error: `User was created in Auth but the profile update failed: ${updateError.message}. Please go to User Management and update their subscription manually.` 
      }
    }

    return { 
      success: true, 
      message: `✅ Successfully migrated ${username} (${email})${daysLeft > 0 ? ` with ${daysLeft} subscription days` : ' (no subscription)'}. Tell them to use "Forgot Password" on the login page to set their password.` 
    }

  } catch (err) {
    console.error('Migration error:', err)
    return { error: 'An unexpected error occurred during migration.' }
  }
}
