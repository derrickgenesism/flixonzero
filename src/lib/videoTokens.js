/**
 * Stateless Video Token Store
 * 
 * Generates HMAC-signed stateless tokens that encode the video URL and expiration time.
 * Works 100% reliably across all Vercel serverless instances without in-memory state.
 */

import crypto from 'crypto';

const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'flixon-secret-key-3000';
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Sign payload string using HMAC SHA-256
 */
function sign(data) {
  return crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
}

/**
 * Create a secure stateless token for a given video URL.
 * @param {string} videoUrl - The real video URL
 * @param {string} userId - The authenticated user's ID
 * @returns {string} - Signed token string
 */
export function createVideoToken(videoUrl, userId) {
  const payload = JSON.stringify({
    url: videoUrl,
    uid: userId,
    exp: Date.now() + TOKEN_TTL_MS,
  });

  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

/**
 * Resolve and verify a token back to its video URL.
 * @param {string} token
 * @returns {{ videoUrl: string, userId: string } | null}
 */
export function resolveVideoToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;

  // Verify HMAC signature
  const expectedSignature = sign(encodedPayload);
  if (signature !== expectedSignature) {
    console.error('[videoTokens] Invalid signature');
    return null;
  }

  try {
    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const data = JSON.parse(payloadJson);

    // Verify expiration
    if (!data.exp || data.exp < Date.now()) {
      console.error('[videoTokens] Token expired');
      return null;
    }

    return { videoUrl: data.url, userId: data.uid };
  } catch (err) {
    console.error('[videoTokens] Failed to parse payload:', err);
    return null;
  }
}

