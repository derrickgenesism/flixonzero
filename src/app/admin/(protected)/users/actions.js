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

  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabaseAdmin = createAdminClient()

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

export async function updateSubscriptionDays(profileId, daysToAdd) {
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
    return { error: 'Only administrators can modify subscriptions.' }
  }

  // Get user's current subscription end date
  const { data: targetProfile, error: targetError } = await supabase
    .from('user_profiles')
    .select('subscription_end_date')
    .eq('id', profileId)
    .single()

  if (targetError || !targetProfile) {
    return { error: 'Failed to fetch user profile.' }
  }

  let currentExpiry = new Date();
  if (targetProfile.subscription_end_date) {
    const profileExpiry = new Date(targetProfile.subscription_end_date);
    if (profileExpiry > currentExpiry) {
      currentExpiry = profileExpiry;
    }
  }

  currentExpiry.setDate(currentExpiry.getDate() + Number(daysToAdd));

  // Update the target user's subscription
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ subscription_end_date: currentExpiry.toISOString() })
    .eq('id', profileId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function getUserAnalytics(userId) {
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
    return { error: 'Only administrators can view analytics.' }
  }

  // Get user profile first to get email
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { error: 'User profile not found in database.' }
  }

  // Use admin client to get auth user for last login
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const supabaseAdmin = createAdminClient()

  let authUser = null;
  if (profile.email) {
    // We cannot use getUserById because userId is the integer profile ID, not the auth UUID.
    // listUsers doesn't have an email search filter, so we must find it manually.
    let page = 1;
    let found = false;
    while (!found) {
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listError || !listData?.users || listData.users.length === 0) break;
      
      const match = listData.users.find(u => u.email === profile.email);
      if (match) {
        authUser = match;
        found = true;
        break;
      }
      
      if (listData.users.length < 1000) break; // Last page
      page++;
    }
  }

  // Get watch history
  // Note: watch_history uses auth.users UUID, not user_profiles integer ID
  let watchHistory = [];
  if (authUser) {
    const { data, error: watchError } = await supabase
      .from('watch_history')
      .select('*, movies(id, title, poster_path)')
      .eq('user_id', authUser.id)
      .order('updated_at', { ascending: false })
      .limit(50);
      
    if (data) watchHistory = data;
  }

  return {
    success: true,
    data: {
      profile,
      authData: {
        created_at: authUser?.created_at,
        last_sign_in_at: authUser?.last_sign_in_at,
      },
      watchHistory: watchHistory || []
    }
  }
}
