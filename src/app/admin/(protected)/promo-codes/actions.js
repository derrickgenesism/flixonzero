'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createPromoCode(formData) {
  const kind         = formData.get('kind');
  const rawCode      = (formData.get('code') || '').trim().toUpperCase();
  const expiresRaw   = formData.get('expires_at');
  const expires_at   = expiresRaw ? new Date(expiresRaw).toISOString() : null;

  if (kind === 'promo') {
    const code          = rawCode || generateCode();
    const discount_type = formData.get('discount_type') || 'percentage';
    const discount_value = Number(formData.get('discount_value') || 0);
    const maxUsesRaw    = formData.get('max_uses');
    const max_uses      = maxUsesRaw ? Number(maxUsesRaw) : null;

    await supabase.from('promo_codes').insert({
      code, discount_type, discount_value, max_uses, expires_at, is_active: true
    });
  } else if (kind === 'gift') {
    const days     = Number(formData.get('days') || 30);
    const quantity = Math.min(100, Math.max(1, Number(formData.get('quantity') || 1)));

    const giftCards = Array.from({ length: quantity }, () => ({
      code: rawCode && quantity === 1 ? rawCode : generateCode(10),
      days,
      expires_at
    }));

    await supabase.from('gift_cards').insert(giftCards);
  }

  revalidatePath('/admin/promo-codes');
}

export async function deletePromoCode(formData) {
  const id = formData.get('id');
  await supabase.from('promo_codes').update({ is_active: false }).eq('id', id);
  revalidatePath('/admin/promo-codes');
}
