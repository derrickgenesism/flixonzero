/**
 * Secure Video Token Store
 * 
 * Generates short-lived signed tokens that map to real video URLs.
 * Tokens are stored in memory (Map) and expire after 2 hours.
 * The real R2/CDN URL is NEVER sent to the browser.
 */

import crypto from 'crypto';

// In-memory token store: token → { videoUrl, expiresAt, userId }
// In production on a multi-instance server, upgrade this to Supabase or Redis.
const tokenStore = new Map();

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CLEANUP_INTERVAL = 15 * 60 * 1000;  // cleanup every 15 minutes

// Periodically clean up expired tokens
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [token, data] of tokenStore.entries()) {
      if (data.expiresAt < now) tokenStore.delete(token);
    }
  }, CLEANUP_INTERVAL);
}

/**
 * Create a secure token for a given video URL.
 * @param {string} videoUrl - The real (hidden) video URL
 * @param {string} userId - The authenticated user's ID
 * @returns {string} - Short-lived opaque token
 */
export function createVideoToken(videoUrl, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  tokenStore.set(token, {
    videoUrl,
    userId,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

/**
 * Resolve a token back to its video URL.
 * @param {string} token
 * @returns {{ videoUrl: string, userId: string } | null}
 */
export function resolveVideoToken(token) {
  const entry = tokenStore.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return null;
  }
  return { videoUrl: entry.videoUrl, userId: entry.userId };
}
