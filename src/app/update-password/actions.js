'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData) {
  const password = formData.get('password')
  
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    redirect(`/update-password?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/?message=Password updated successfully')
}
