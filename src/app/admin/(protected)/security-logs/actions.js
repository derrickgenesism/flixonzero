'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  blockIpAddress,
  unblockIpAddress,
  blockFingerprint,
  unblockFingerprint,
  updateVpnSettings,
  checkVpnOrProxy
} from '@/lib/ipShield';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}

export async function toggleVpnShieldAction(enabled, mode) {
  await verifyAdmin();
  await updateVpnSettings({ enabled, mode });
  revalidatePath('/admin/security-logs');
  revalidatePath('/admin/settings');
  return { success: true };
}

export async function blockIpServerAction(ip, reason) {
  const user = await verifyAdmin();
  if (!ip || typeof ip !== 'string') return { success: false, error: 'Invalid IP address' };

  const result = await blockIpAddress({
    ip: ip.trim(),
    reason: reason?.trim() || 'Manual block via Security Center',
    blockedBy: user.email
  });

  revalidatePath('/admin/security-logs');
  return result;
}

export async function unblockIpServerAction(ip) {
  await verifyAdmin();
  if (!ip) return { success: false, error: 'No IP provided' };

  const result = await unblockIpAddress(ip.trim());
  revalidatePath('/admin/security-logs');
  return result;
}

export async function blockFingerprintServerAction(fingerprint, reason) {
  await verifyAdmin();
  if (!fingerprint) return { success: false, error: 'No fingerprint provided' };

  const result = await blockFingerprint(fingerprint.trim(), reason?.trim() || 'Manual ban');
  revalidatePath('/admin/security-logs');
  return result;
}

export async function unblockFingerprintServerAction(fingerprint) {
  await verifyAdmin();
  if (!fingerprint) return { success: false, error: 'No fingerprint provided' };

  const result = await unblockFingerprint(fingerprint.trim());
  revalidatePath('/admin/security-logs');
  return result;
}

export async function testIpLookupAction(ip) {
  await verifyAdmin();
  if (!ip) return { success: false, error: 'No IP provided' };
  const info = await checkVpnOrProxy(ip.trim());
  return { success: true, info };
}
