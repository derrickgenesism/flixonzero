import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import crypto from 'crypto';

// In-memory sliding hour tracker to prevent click-farm spam
// affiliateId -> { count: number, resetAt: number }
const hourlyClickTracker = new Map();
const MAX_CLICKS_PER_HOUR = 60;

function isBot(ua) {
  if (!ua) return true;
  const botKeywords = [
    'bot', 'spider', 'crawl', 'slurp', 'mediapartners', 'googlebot',
    'bingbot', 'yandex', 'baidu', 'duckduckbot', 'ahrefs', 'semrush',
    'curl', 'wget', 'python', 'headless', 'phantomjs', 'node-fetch',
    'axios', 'got', 'httpclient', 'postman'
  ];
  const lower = ua.toLowerCase();
  return botKeywords.some(b => lower.includes(b));
}

export async function POST(request) {
  try {
    const { ref } = await request.json();
    if (!ref || typeof ref !== 'string') {
      return NextResponse.json({ error: 'Missing ref' }, { status: 400 });
    }

    const cleanRef = ref.trim().toLowerCase();
    const admin = createAdminClient();

    // 1. Check if PPC is globally enabled
    const { data: ppcSetting } = await admin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'affiliate_ppc_enabled')
      .maybeSingle();

    if (ppcSetting?.setting_value !== 'true') {
      return NextResponse.json({ success: false, message: 'PPC disabled' });
    }

    // 2. Look up the affiliate by referral code
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, user_id, balance, total_earned, status')
      .ilike('referral_code', cleanRef)
      .maybeSingle();

    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid ref' }, { status: 404 });
    }

    // Must be approved to earn click rewards
    if (affiliate.status !== 'approved' && affiliate.status !== null) {
      return NextResponse.json({ success: false, message: 'Affiliate not active' });
    }

    // 3. Bot filter
    const ua = request.headers.get('user-agent') || '';
    if (isBot(ua)) {
      return NextResponse.json({ success: true, message: 'Bot filtered' });
    }

    // 4. IP + UA uniqueness hashing
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';

    const rawString = `${ip}-${ua}`;
    const hash = crypto.createHash('sha256').update(rawString).digest('hex');

    // 5. Deduplicate: Has this visitor clicked THIS affiliate link before?
    const { data: existingClick } = await admin
      .from('affiliate_clicks')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('ip_ua_hash', hash)
      .maybeSingle();

    if (existingClick) {
      return NextResponse.json({ success: true, message: 'Already tracked' });
    }

    // 6. Anti-Click-Farm Hourly Throttle
    const now = Date.now();
    let tracker = hourlyClickTracker.get(affiliate.id);
    if (!tracker || now > tracker.resetAt) {
      tracker = { count: 0, resetAt: now + (60 * 60 * 1000) };
      hourlyClickTracker.set(affiliate.id, tracker);
    }

    tracker.count++;
    if (tracker.count > MAX_CLICKS_PER_HOUR) {
      return NextResponse.json({ success: true, message: 'Hourly cap reached' });
    }

    // 7. Record unique click
    await admin.from('affiliate_clicks').insert({
      affiliate_id: affiliate.id,
      ip_ua_hash: hash
    });

    // 8. Calculate reward (CPM / 1000)
    const { data: cpmSetting } = await admin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'affiliate_cpm_rate')
      .maybeSingle();

    const cpm = Number(cpmSetting?.setting_value || 5000);
    const amountPerClick = Math.round((cpm / 1000) * 100) / 100; // 2 decimal precision

    if (amountPerClick > 0) {
      await admin.from('affiliates')
        .update({
          balance: Number(affiliate.balance || 0) + amountPerClick,
          total_earned: Number(affiliate.total_earned || 0) + amountPerClick
        })
        .eq('id', affiliate.id);

      await admin.from('affiliate_commissions').insert({
        affiliate_id: affiliate.id,
        amount: amountPerClick,
        type: 'click',
        description: 'Unique Link Visit'
      });
    }

    return NextResponse.json({ success: true, amountPerClick });
  } catch (err) {
    console.error('[affiliate track error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
