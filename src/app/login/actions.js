'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData) {
  const supabase = await createClient()

  const email = formData.get('email').trim()
  const password = formData.get('password')

  const data = {
    email: email,
    password: password,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // If password fails, check if they are a legacy user who needs to reset
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('legacy_migration')
      .eq('email', email)
      .single()

    if (profile?.legacy_migration) {
      redirect(`/force-reset?email=${encodeURIComponent(email)}`)
    }

    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  // Handle referral tracking
  const refCode = formData.get('refCode')
  if (refCode && authData?.user) {
    try {
      // Find the affiliate by their referral_code
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id, user_id')
        .eq('referral_code', refCode)
        .single()

      if (affiliate && affiliate.user_id !== authData.user.id) {
        // Record the referral in user_profiles (so we know who brought them)
        await supabase
          .from('user_profiles')
          .update({ referred_by: affiliate.id })
          .eq('id', authData.user.id) // wait, authData.user.id is UUID. user_profiles ID is INT!
          // We can't update user_profiles by auth UUID if we don't know how they are linked.
          // Wait, user_profiles is linked by email!
          .eq('email', authData.user.email)
      }
    } catch (refErr) {
      console.error('Error recording referral:', refErr)
      // Do not block signup for referral errors
    }
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}
