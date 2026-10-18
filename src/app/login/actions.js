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
  let refCode = formData.get('refCode')
  if (!refCode) {
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      refCode = cookieStore.get('affiliate_ref')?.value
    } catch {
      // Cookie reading fallback
    }
  }

  if (refCode && authData?.user?.email) {
    try {
      const { createAdminClient } = await import('@/utils/supabase/admin')
      const admin = createAdminClient()

      const { data: affiliate } = await admin
        .from('affiliates')
        .select('id, user_id, status')
        .ilike('referral_code', String(refCode).trim())
        .maybeSingle()

      if (affiliate && (affiliate.status === 'approved' || !affiliate.status) && affiliate.user_id !== authData.user.id) {
        const cleanEmail = authData.user.email.toLowerCase().trim()
        // Retry loop to ensure profile created by trigger exists
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data: updated } = await admin
            .from('user_profiles')
            .update({ referred_by: affiliate.id })
            .eq('email', cleanEmail)
            .select('id')

          if (updated && updated.length > 0) break
          await new Promise(r => setTimeout(r, 350))
        }
      }
    } catch (refErr) {
      console.error('Error recording referral:', refErr)
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
