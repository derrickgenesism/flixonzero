'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const PROFILE_COOKIE = 'flixon_profile_id';

// Fetch all profiles for the logged-in user
export async function getProfiles() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const { data: profiles, error } = await supabase
      .from('sub_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching profiles:', JSON.stringify(error));
      return [];
    }
    if (!profiles) {
      console.warn('No profiles returned, returning empty array');
      return [];
    }
    return profiles;
  } catch (e) {
    console.error('Unexpected error fetching profiles:', e);
    return [];
  }
}

// Get the currently active profile based on the cookie
export async function getActiveProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const profileId = cookieStore.get(PROFILE_COOKIE)?.value;

  if (profileId) {
    const { data: profile } = await supabase
      .from('sub_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id) // Ensure security
      .single();
    
    if (profile) return profile;
  }

  // Fallback to the first profile if no cookie or invalid cookie
  let { data: firstProfile } = await supabase
    .from('sub_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!firstProfile) {
    // Auto-create a default profile if the user has NONE
    const { data: newProfile, error: insertErr } = await supabase
      .from('sub_profiles')
      .insert({ user_id: user.id, name: 'My Profile' })
      .select()
      .single();
    
    if (!insertErr && newProfile) {
      firstProfile = newProfile;
    }
  }

  if (firstProfile) {
    // We cannot set cookies during a Server Component render.
    // The user will just use the first profile in memory.
    // If they explicitly go to /profiles and click, it will be set.
    return firstProfile;
  }

  return null;
}

// Set the active profile cookie
export async function setActiveProfile(profileId) {
  const cookieStore = await cookies();
  cookieStore.set(PROFILE_COOKIE, profileId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
  revalidatePath('/', 'layout'); // Force a full re-render
}

// Create a new profile
export async function createProfile(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const name = formData.get('name');
  if (!name || name.trim().length === 0) {
    return { error: 'Name is required' };
  }

  // Check limit
  const { count } = await supabase
    .from('sub_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('extra_profile_slots')
    .eq('email', user.email)
    .single();

  const { data: limitSetting } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'free_profiles_limit')
    .maybeSingle();

  const freeLimit = limitSetting ? parseInt(limitSetting.setting_value) || 2 : 2;
  const extraSlots = userProfile?.extra_profile_slots || 0;
  
  let maxAllowed = freeLimit + extraSlots;
  if (maxAllowed > 5) maxAllowed = 5;

  if (count >= maxAllowed) {
    return { error: `Maximum of ${maxAllowed} profiles allowed.` };
  }

  const { error } = await supabase.from('sub_profiles').insert({
    user_id: user.id,
    name: name.trim()
  });

  if (error) return { error: error.message };
  
  revalidatePath('/profiles');
  return { success: true };
}

// Delete a profile
export async function deleteProfile(profileId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Cannot delete the last profile
  const { count } = await supabase
    .from('sub_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (count <= 1) {
    return { error: 'You must have at least one profile.' };
  }

  const { error } = await supabase
    .from('sub_profiles')
    .delete()
    .eq('id', profileId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  
  // If we just deleted the active profile, clear the cookie
  const cookieStore = await cookies();
  if (cookieStore.get(PROFILE_COOKIE)?.value === profileId) {
    cookieStore.delete(PROFILE_COOKIE);
  }

  revalidatePath('/profiles');
  revalidatePath('/', 'layout');
  return { success: true };
}

// Logout overrides the default logout to also clear the profile cookie
export async function logoutAndClearProfile() {
  const cookieStore = await cookies();
  cookieStore.delete(PROFILE_COOKIE);
  
  const supabase = await createClient();
  await supabase.auth.signOut();
}
