#!/usr/bin/env node
/**
 * FlixOn Administrator IP & Violator Shield CLI
 * 
 * Usage:
 *   node scripts/block-ip.js list
 *   node scripts/block-ip.js block <ip-or-email> [reason]
 *   node scripts/block-ip.js unblock <ip-or-fingerprint>
 *   node scripts/block-ip.js vpn <on|off> [mode: all|checkout]
 *   node scripts/block-ip.js check <ip>
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      if (key !== 'NODE_TLS_REJECT_UNAUTHORIZED' && !process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function sendTelegramAlert(text) {
  try {
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['telegram_bot_token', 'telegram_chat_id']);

    const botToken = settings?.find((s) => s.setting_key === 'telegram_bot_token')?.setting_value?.trim();
    const chatId = settings?.find((s) => s.setting_key === 'telegram_chat_id')?.setting_value?.trim();

    if (!botToken || !chatId) return;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch (err) {
    console.error('⚠️ Telegram alert error:', err.message);
  }
}

async function getSettings() {
  const { data: rows } = await supabase
    .from('admin_settings')
    .select('setting_key, setting_value')
    .in('setting_key', [
      'blocked_ips',
      'blocked_fingerprints',
      'vpn_blocking_enabled',
      'vpn_blocking_mode'
    ]);

  const getVal = (key) => rows?.find((r) => r.setting_key === key)?.setting_value;

  let blockedIps = [];
  try {
    const raw = getVal('blocked_ips');
    if (raw) blockedIps = JSON.parse(raw);
  } catch {}

  let blockedFingerprints = [];
  try {
    const raw = getVal('blocked_fingerprints');
    if (raw) blockedFingerprints = JSON.parse(raw);
  } catch {}

  const vpnEnabled = getVal('vpn_blocking_enabled') === 'true';
  const vpnMode = getVal('vpn_blocking_mode') || 'all';

  return { blockedIps, blockedFingerprints, vpnEnabled, vpnMode };
}

async function listCommand() {
  console.log('\n======================================================');
  console.log('🛡️  FLIXON SECURITY SHIELD & IP BLOCKLIST STATUS');
  console.log('======================================================');

  const { blockedIps, blockedFingerprints, vpnEnabled, vpnMode } = await getSettings();

  console.log(`\n🌐 VPN & Proxy Shield: ${vpnEnabled ? '✅ ACTIVE' : '❌ DISABLED'}`);
  console.log(`🔒 Enforcement Scope:  ${vpnMode === 'all' ? 'Whole Platform (Site-wide)' : 'Checkout & Payments Only'}`);

  console.log(`\n⛔ Blocked IP Addresses (${blockedIps.length}):`);
  if (blockedIps.length === 0) {
    console.log('   (No IPs currently blocked)');
  } else {
    blockedIps.forEach((item, idx) => {
      const ip = typeof item === 'string' ? item : item.ip;
      const reason = typeof item === 'object' ? item.reason : 'Manual block';
      const date = typeof item === 'object' && item.blocked_at ? new Date(item.blocked_at).toLocaleString() : '';
      console.log(`   ${idx + 1}. [${ip}] - ${reason} ${date ? `(${date})` : ''}`);
      if (item.associated_accounts?.length) {
        console.log(`      Linked Banned Accounts: ${item.associated_accounts.join(', ')}`);
      }
    });
  }

  console.log(`\n📱 Blocked Device Fingerprints (${blockedFingerprints.length}):`);
  if (blockedFingerprints.length === 0) {
    console.log('   (No device fingerprints currently blocked)');
  } else {
    blockedFingerprints.forEach((fp, idx) => {
      console.log(`   ${idx + 1}. ${fp}`);
    });
  }
  console.log('\n======================================================\n');
}

async function blockCommand(target, reason = 'Administrative block for policy violation') {
  if (!target) {
    console.error('❌ Error: Please specify an IP address or user email to block.');
    console.log('Usage: node scripts/block-ip.js block <ip-or-email> [reason]');
    return;
  }

  const isEmail = target.includes('@');
  const { blockedIps, blockedFingerprints } = await getSettings();
  const bannedUsers = [];
  const bannedFingerprints = [];

  if (isEmail) {
    console.log(`🔍 Inspecting accounts and devices linked to email: ${target}...`);

    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, email, username, role')
      .eq('email', target)
      .maybeSingle();

    if (!profile) {
      console.error(`❌ No user found with email: ${target}`);
      return;
    }

    // Ban in user_profiles
    await supabase.from('user_profiles').update({ role: 'banned' }).eq('id', profile.id);
    bannedUsers.push(profile.email);

    // Ban in Supabase auth
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users?.find((u) => u.email === profile.email);
      if (authUser) {
        await supabase.auth.admin.updateUserById(authUser.id, { ban_duration: '876000h' });
      }
    } catch (e) {
      console.warn('⚠️ Auth ban note:', e.message);
    }

    // Find all visitor_ids / fingerprints used by this user in site_visits
    const { data: visits } = await supabase
      .from('site_visits')
      .select('visitor_id, user_agent')
      .eq('user_id', profile.id);

    const visitorIds = Array.from(new Set((visits || []).map((v) => v.visitor_id).filter(Boolean)));

    for (const vid of visitorIds) {
      bannedFingerprints.push(vid);
      if (!blockedFingerprints.includes(vid)) {
        blockedFingerprints.push(vid);
      }

      // Check if any OTHER accounts logged in with this same visitor_id!
      const { data: otherVisits } = await supabase
        .from('site_visits')
        .select('user_id')
        .eq('visitor_id', vid);

      const otherUserIds = Array.from(new Set((otherVisits || []).map((v) => v.user_id).filter(Boolean)));
      for (const ouid of otherUserIds) {
        if (ouid !== profile.id) {
          const { data: otherProfile } = await supabase
            .from('user_profiles')
            .select('id, email')
            .eq('id', ouid)
            .maybeSingle();

          if (otherProfile && !bannedUsers.includes(otherProfile.email)) {
            console.log(`🚨 Caught linked account on same device: ${otherProfile.email}`);
            await supabase.from('user_profiles').update({ role: 'banned' }).eq('id', otherProfile.id);
            bannedUsers.push(otherProfile.email);
            try {
              await supabase.auth.admin.updateUserById(otherProfile.id, { ban_duration: '876000h' });
            } catch {}
          }
        }
      }
    }

    // Save blocked fingerprints
    await supabase.from('admin_settings').upsert(
      {
        setting_key: 'blocked_fingerprints',
        setting_value: JSON.stringify(blockedFingerprints)
      },
      { onConflict: 'setting_key' }
    );

    console.log(`\n✅ Account Banned: ${target}`);
    console.log(`📱 Linked Device Fingerprints Blocked (${bannedFingerprints.length}):`, bannedFingerprints);
    console.log(`👥 Total Linked Accounts Auto-Banned (${bannedUsers.length}):`, bannedUsers);

    // Send Telegram Alert
    await sendTelegramAlert(
      `🚨 <b>ADMIN ACTION: USER & DEVICES BANNED</b>\n\n` +
      `<b>Target Account:</b> <code>${target}</code>\n` +
      `<b>Reason:</b> ${reason}\n` +
      `<b>Device Fingerprints Blocked:</b> <code>${bannedFingerprints.join(', ') || 'N/A'}</code>\n` +
      `<b>All Auto-Banned Accounts:</b> <code>${bannedUsers.join(', ')}</code>\n\n` +
      `<i>Executed via FlixOn CLI Shield Tool</i>`
    );

  } else {
    // Target is an IP address
    const ip = target.trim();
    console.log(`⛔ Blocking IP address: ${ip}...`);

    // Find any users associated with this IP if known
    const entry = {
      ip,
      reason,
      blocked_by: 'admin_cli',
      blocked_at: new Date().toISOString(),
      associated_accounts: bannedUsers
    };

    const existingIdx = blockedIps.findIndex((item) => (typeof item === 'string' ? item === ip : item.ip === ip));
    if (existingIdx >= 0) {
      blockedIps[existingIdx] = entry;
    } else {
      blockedIps.unshift(entry);
    }

    await supabase.from('admin_settings').upsert(
      {
        setting_key: 'blocked_ips',
        setting_value: JSON.stringify(blockedIps)
      },
      { onConflict: 'setting_key' }
    );

    console.log(`✅ IP Address [${ip}] successfully blocked.`);

    await sendTelegramAlert(
      `⛔ <b>ADMIN ACTION: IP ADDRESS BLOCKED</b>\n\n` +
      `<b>Blocked IP:</b> <code>${ip}</code>\n` +
      `<b>Reason:</b> ${reason}\n` +
      `<b>Total Blocked IPs:</b> ${blockedIps.length}\n\n` +
      `<i>Any account attempting access from this IP will be rejected and auto-banned.</i>`
    );
  }
}

async function unblockCommand(target) {
  if (!target) {
    console.error('❌ Error: Specify an IP address or device fingerprint to unblock.');
    return;
  }

  const { blockedIps, blockedFingerprints } = await getSettings();

  // Check if it's an IP
  const filteredIps = blockedIps.filter((item) => (typeof item === 'string' ? item !== target : item.ip !== target));
  if (filteredIps.length !== blockedIps.length) {
    await supabase.from('admin_settings').upsert(
      {
        setting_key: 'blocked_ips',
        setting_value: JSON.stringify(filteredIps)
      },
      { onConflict: 'setting_key' }
    );
    console.log(`✅ IP [${target}] has been unblocked.`);
    return;
  }

  // Check if it's a fingerprint
  const filteredFps = blockedFingerprints.filter((fp) => fp !== target);
  if (filteredFps.length !== blockedFingerprints.length) {
    await supabase.from('admin_settings').upsert(
      {
        setting_key: 'blocked_fingerprints',
        setting_value: JSON.stringify(filteredFps)
      },
      { onConflict: 'setting_key' }
    );
    console.log(`✅ Device fingerprint [${target}] has been unblocked.`);
    return;
  }

  console.log(`ℹ️ [${target}] was not found in blocked IPs or blocked fingerprints.`);
}

async function vpnCommand(status, mode = 'all') {
  if (!status || (status !== 'on' && status !== 'off')) {
    console.error('❌ Error: Specify on or off. Example: node scripts/block-ip.js vpn on [all|checkout]');
    return;
  }

  const isEnabled = status === 'on';
  const cleanMode = mode === 'checkout' ? 'checkout' : 'all';

  await supabase.from('admin_settings').upsert(
    { setting_key: 'vpn_blocking_enabled', setting_value: isEnabled ? 'true' : 'false' },
    { onConflict: 'setting_key' }
  );

  await supabase.from('admin_settings').upsert(
    { setting_key: 'vpn_blocking_mode', setting_value: cleanMode },
    { onConflict: 'setting_key' }
  );

  console.log(`✅ VPN Shield is now ${isEnabled ? 'ACTIVATED (ON)' : 'DISABLED (OFF)'}`);
  console.log(`🔒 Enforcement Scope: ${cleanMode === 'all' ? 'Whole Platform' : 'Checkout & Payments Only'}`);

  await sendTelegramAlert(
    `🌐 <b>VPN SHIELD SETTINGS UPDATED</b>\n\n` +
    `<b>Status:</b> ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n` +
    `<b>Scope:</b> ${cleanMode === 'all' ? 'Whole Platform' : 'Checkout & Payments Only'}\n\n` +
    `<i>Updated via FlixOn CLI</i>`
  );
}

async function checkCommand(ip) {
  if (!ip) {
    console.error('❌ Error: Specify an IP address to inspect.');
    return;
  }

  console.log(`🔍 Inspecting IP [${ip}] via live IP intelligence...`);
  try {
    let data = null;
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,isp,org,as,mobile,proxy,hosting,query`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') data = json;
      }
    } catch {}

    if (!data) {
      try {
        const secRes = await fetch(`https://ipwho.is/${ip}`);
        if (secRes.ok) {
          const sec = await secRes.json();
          if (sec.success) {
            data = {
              query: ip,
              isp: sec.connection?.isp || sec.connection?.org,
              org: sec.connection?.org,
              as: `AS${sec.connection?.asn || ''} ${sec.connection?.isp || ''}`,
              city: sec.city,
              regionName: sec.region,
              country: sec.country,
              mobile: false,
              proxy: !!(sec.security?.proxy || sec.security?.vpn || sec.security?.tor),
              hosting: !!sec.security?.hosting
            };
          }
        }
      } catch {}
    }

    if (!data) {
      console.error('❌ Lookup failed: Both primary and secondary IP providers unreachable.');
      return;
    }

    const isUgandaMobile = ['mtn', 'airtel', 'uganda telecom', 'roke', 'liquid'].some(
      (k) => (data.isp || '').toLowerCase().includes(k) || (data.as || '').toLowerCase().includes(k)
    );

    const isVpn = !isUgandaMobile && (data.proxy || (data.hosting && !data.mobile));

    console.log('\n--- IP INSPECTION REPORT ---');
    console.log(`Query IP:        ${data.query}`);
    console.log(`ISP:             ${data.isp}`);
    console.log(`Organization:    ${data.org}`);
    console.log(`ASN:             ${data.as}`);
    console.log(`Location:        ${data.city}, ${data.regionName}, ${data.country}`);
    console.log(`Cellular Mobile: ${data.mobile ? '📱 YES' : 'No'}`);
    console.log(`Proxy / VPN:     ${data.proxy ? '🚨 YES (Proxy Node)' : 'No'}`);
    console.log(`Datacenter Host: ${data.hosting ? '🏢 YES (Cloud VPS)' : 'No'}`);
    console.log(`FlixOn Verdict:  ${isVpn ? '⛔ BLOCKED (VPN / Datacenter)' : '✅ ALLOWED (Clean Connection)'}`);
    console.log('----------------------------\n');
  } catch (err) {
    console.error('❌ Inspection error:', err.message);
  }
}

async function main() {
  const [,, cmd, arg1, arg2] = process.argv;

  switch (cmd) {
    case 'list':
      await listCommand();
      break;
    case 'block':
      await blockCommand(arg1, arg2);
      break;
    case 'unblock':
      await unblockCommand(arg1);
      break;
    case 'vpn':
      await vpnCommand(arg1, arg2);
      break;
    case 'check':
      await checkCommand(arg1);
      break;
    default:
      console.log(`
🛡️  FlixOn Administrator IP & Violator Shield CLI

Commands:
  node scripts/block-ip.js list
      List all blocked IPs, fingerprints, and VPN shield status

  node scripts/block-ip.js block <ip-or-email> [reason]
      Block an IP address or ban a user email, auto-discovering all linked devices and accounts

  node scripts/block-ip.js unblock <ip-or-fingerprint>
      Unblock an IP address or device fingerprint

  node scripts/block-ip.js vpn <on|off> [all|checkout]
      Toggle VPN blocking on or off, and set mode

  node scripts/block-ip.js check <ip>
      Real-time inspection of an IP address (ISP, VPN, Datacenter detection)
      `);
      break;
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
