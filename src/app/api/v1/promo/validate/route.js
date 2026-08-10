import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/v1/promo/validate  { code, planAmount }
export async function POST(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ valid: false, error: 'Please log in.' }, { status: 401 });

    const { code, planAmount } = await request.json();
    if (!code) return NextResponse.json({ valid: false, error: 'No code provided.' });

    // Check promo code
    const { data: promo } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .maybeSingle();

    if (!promo) {
      // Check gift card
      const { data: gift } = await supabaseAdmin
        .from('gift_cards')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .is('used_by', null)
        .maybeSingle();

      if (!gift) return NextResponse.json({ valid: false, error: 'Invalid or already used code.' });

      // Check gift card expiry
      if (gift.expires_at && new Date(gift.expires_at) < new Date()) {
        return NextResponse.json({ valid: false, error: 'This gift card has expired.' });
      }

      return NextResponse.json({
        valid: true,
        type: 'gift_card',
        code: gift.code,
        id: gift.id,
        days: gift.days,
        discount: 0,
        finalAmount: planAmount,
        message: `🎁 Gift card gives you ${gift.days} days of free access!`
      });
    }

    // Check expiry and use count
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This promo code has expired.' });
    }
    if (promo.max_uses && promo.use_count >= promo.max_uses) {
      return NextResponse.json({ valid: false, error: 'This promo code has reached its limit.' });
    }

    // Check if user already used it
    const { data: used } = await supabaseAdmin
      .from('promo_code_uses')
      .select('id')
      .eq('code_id', promo.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (used) return NextResponse.json({ valid: false, error: 'You have already used this code.' });

    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = Math.floor((planAmount * promo.discount_value) / 100);
    } else {
      discount = Math.min(planAmount, promo.discount_value);
    }

    const finalAmount = Math.max(0, planAmount - discount);

    return NextResponse.json({
      valid: true,
      type: 'promo',
      code: promo.code,
      id: promo.id,
      discount,
      finalAmount,
      message: `✅ ${promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `${Number(promo.discount_value).toLocaleString()} UGX`} off applied!`
    });
  } catch (err) {
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
