import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { ref } = await request.json();
    if (!ref) return NextResponse.json({ error: 'Missing ref' }, { status: 400 });

    // Check if PPC is enabled
    const { data: ppcSetting } = await supabaseAdmin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'affiliate_ppc_enabled')
      .maybeSingle();

    if (ppcSetting?.setting_value !== 'true') {
      return NextResponse.json({ success: false, message: 'PPC disabled' });
    }

    // Get the affiliate by code
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id, balance, total_earned')
      .eq('referral_code', ref)
      .maybeSingle();

    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid ref' }, { status: 400 });
    }

    // Hash IP + User-Agent to prevent duplicate spamming
    // Vercel forwards real IP in 'x-forwarded-for' or 'x-real-ip'
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown-ip';
    const ua = request.headers.get('user-agent') || 'unknown-ua';
    
    // Hash them to respect privacy but ensure uniqueness
    const rawString = `${ip}-${ua}`;
    const hash = crypto.createHash('sha256').update(rawString).digest('hex');

    // Check if this hash clicked THIS affiliate link before
    const { data: existingClick } = await supabaseAdmin
      .from('affiliate_clicks')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('ip_ua_hash', hash)
      .maybeSingle();

    if (existingClick) {
      return NextResponse.json({ success: true, message: 'Already tracked' });
    }

    // Not clicked before! Insert the click
    await supabaseAdmin.from('affiliate_clicks').insert({
      affiliate_id: affiliate.id,
      ip_ua_hash: hash
    });

    // Calculate fractional earnings (CPM / 1000)
    const { data: cpmSetting } = await supabaseAdmin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'affiliate_cpm_rate')
      .maybeSingle();
    
    const cpm = Number(cpmSetting?.setting_value || 5000);
    const amountPerClick = cpm / 1000;

    if (amountPerClick > 0) {
      // Add balance to affiliate
      await supabaseAdmin.from('affiliates')
        .update({
          balance: Number(affiliate.balance) + amountPerClick,
          total_earned: Number(affiliate.total_earned) + amountPerClick
        })
        .eq('id', affiliate.id);

      // Record commission ledger
      await supabaseAdmin.from('affiliate_commissions').insert({
        affiliate_id: affiliate.id,
        amount: amountPerClick,
        type: 'click',
        description: 'Unique Link Visit'
      });
    }

    return NextResponse.json({ success: true, amountPerClick });
  } catch (err) {
    console.error('[affiliate track]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
