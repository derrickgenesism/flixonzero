import crypto from 'crypto';

const CDN_SECRET = process.env.FLIXON_CDN_SECRET || 'flixon_secure_stream_b2_99482184021';

/**
 * Generate a signed CDN download URL valid for specified duration (default: 30 minutes)
 * @param {string} videoPath - The path or key of the video (e.g. '/movie.mp4')
 * @param {number} ttlSeconds - Time-to-live in seconds (default: 1800 = 30 minutes)
 * @param {boolean} forceDownload - Whether to append &download=1
 * @returns {string} - Fully signed secure CDN URL
 */
export function generateSignedCdnUrl(videoPath, ttlSeconds = 1800, forceDownload = true) {
  let cleanPath = videoPath;
  try {
    if (cleanPath.startsWith('http')) {
      const u = new URL(cleanPath);
      cleanPath = u.pathname;
    }
  } catch {}

  // Normalize path to clean leading slash
  const normalizedPath = '/' + cleanPath.replace(/^\/+/, '');
  const decodedPath = decodeURIComponent(normalizedPath);
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const message = decodedPath + ':' + exp;

  const token = crypto.createHmac('sha256', CDN_SECRET).update(message).digest('hex');

  const queryParams = new URLSearchParams({
    token,
    exp: exp.toString(),
  });

  if (forceDownload) {
    queryParams.set('download', '1');
  }

  const encodedPath = normalizedPath
    .split('/')
    .map(segment => encodeURIComponent(decodeURIComponent(segment)))
    .join('/');

  return 'https://cdn.flixon.net' + encodedPath + '?' + queryParams.toString();
}
