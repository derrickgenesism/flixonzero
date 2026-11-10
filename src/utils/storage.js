import { S3Client } from '@aws-sdk/client-s3';
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * Retrieves storage credentials and active provider from admin_settings.
 * @param {'b2' | 'r2' | null} requestedProvider If specified, returns that provider's settings; otherwise returns the active default provider.
 */
export async function getStorageConfig(requestedProvider = null) {
  const supabase = createAdminClient();
  const { data: settings, error } = await supabase.from('admin_settings').select('*');
  if (error || !settings) {
    throw new Error('Could not fetch storage settings from admin_settings');
  }

  const find = (key) => settings.find(s => s.setting_key === key)?.setting_value || '';
  const defaultProvider = find('storage_provider') || 'b2';
  const provider = (requestedProvider || defaultProvider).toLowerCase();

  if (provider === 'b2') {
    const endpoint = find('b2_endpoint') || 'https://s3.us-east-005.backblazeb2.com';
    const region = find('b2_region') || 'us-east-005';
    const bucketName = find('b2_bucket_name') || 'flixonvideos';
    const accessKeyId = find('b2_access_key');
    const secretAccessKey = find('b2_secret_key');
    const publicDomain = 'cdn.flixon.net';

    return {
      provider: 'b2',
      endpoint,
      region,
      bucketName,
      accessKeyId,
      secretAccessKey,
      publicDomain,
      publicUrlPrefix: `https://${publicDomain}`,
    };
  } else {
    // Cloudflare R2
    const accountId = find('r2_account_id');
    const accessKeyId = find('r2_access_key');
    const secretAccessKey = find('r2_secret_key');
    const bucketName = find('r2_bucket_name') || 'movies';
    const endpoint = accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '';
    const publicDomain = find('r2_public_domain') || 'pub-86fb3181579649118df994b2cd3cb437.r2.dev';

    return {
      provider: 'r2',
      endpoint,
      region: 'auto',
      bucketName,
      accessKeyId,
      secretAccessKey,
      publicDomain,
      publicUrlPrefix: `https://${publicDomain}`,
    };
  }
}

/**
 * Creates and returns an S3Client configured for Backblaze B2 or Cloudflare R2.
 */
export async function getStorageClient(requestedProvider = null) {
  const config = await getStorageConfig(requestedProvider);
  if (!config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
    throw new Error(`Credentials for ${config.provider.toUpperCase()} are not fully configured.`);
  }

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return { client, config };
}

/**
 * Returns the public CDN streaming URL for an object key.
 */
export function getStoragePublicUrl(key, provider = 'b2') {
  const cleanKey = encodeURIComponent(key).replace(/%2F/g, '/');
  // Both B2 and R2 route through the FlixOn CDN domain
  return `https://cdn.flixon.net/${cleanKey}`;
}
