/**
 * Cloudflare Worker for cdn.flixon.net
 *
 * Security Features:
 * 1. Hotlink Protection: Blocks external sites from stealing or embedding videos.
 * 2. Cryptographic Signed URLs: Downloads and direct links require an unexpired HMAC SHA-256 token.
 * 3. Expiring Links: Download tokens expire after 30 minutes.
 * 4. Bandwidth Alliance: 100% Free ($0.00) Egress from Backblaze B2.
 * 5. Full Range & Scrubbing Support: HTTP 206 Partial Content for video seeking.
 * 6. Global Edge Caching: Caches popular video segments for 30 days.
 */

const SECRET_KEY = "flixon_secure_stream_b2_99482184021";

// Helper: verify HMAC-SHA256 signature using Web Crypto API
async function verifySignature(message, signatureHex, secret) {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const expectedBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(message));
    const expectedHex = Array.from(new Uint8Array(expectedBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    return expectedHex.toLowerCase() === signatureHex.toLowerCase();
  } catch {
    return false;
  }
}

export default {
  async fetch(request, env) {
    const secret = env?.FLIXON_CDN_SECRET || SECRET_KEY;

    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Range, Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    const url = new URL(request.url);

    // 2. Health check / Root
    if (!url.pathname || url.pathname === "/") {
      return new Response("FlixOn Video CDN Active (Protected)", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // 3. Security Check: Allow if from FlixOn website, or if valid signed token
    const referer = request.headers.get("referer") || "";
    const origin = request.headers.get("origin") || "";
    const userAgent = request.headers.get("user-agent") || "";

    const isFromFlixOn =
      referer.includes("flixon.net") ||
      origin.includes("flixon.net") ||
      referer.includes("localhost") ||
      origin.includes("localhost") ||
      userAgent.includes("FlixOnApp");

    const token = url.searchParams.get("token");
    const exp = parseInt(url.searchParams.get("exp") || "0", 10);
    const nowSec = Math.floor(Date.now() / 1000);

    let isAuthorized = false;

    if (isFromFlixOn && !url.searchParams.has("download")) {
      // In-browser stream request originating from FlixOn player
      isAuthorized = true;
    } else if (token && exp) {
      // Signed token request (used for downloads or external direct links)
      if (exp < nowSec) {
        return new Response("Access Denied: Download link expired. Please generate a new one.", {
          status: 403,
          headers: { "Content-Type": "text/plain" }
        });
      }

      // Verify HMAC: message is decodedPath:exp
      const decodedPath = decodeURIComponent(url.pathname);
      const message = decodedPath + ":" + exp;
      const isValid = await verifySignature(message, token, secret);

      if (isValid) {
        isAuthorized = true;
      } else {
        return new Response("Access Denied: Invalid security signature.", {
          status: 403,
          headers: { "Content-Type": "text/plain" }
        });
      }
    }

    // Block any unauthorized direct access or external hotlinking
    if (!isAuthorized) {
      return new Response(
        "Access Denied: Direct video links are protected. Please stream or download via FlixOn.",
        {
          status: 403,
          headers: {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // 4. Stream from Backblaze B2 (Bandwidth Alliance = $0 Egress)
    const b2Origin = "https://f005.backblazeb2.com/file/flixonvideos";
    const targetUrl = new URL(b2Origin + url.pathname);

    const forwardHeaders = new Headers(request.headers);
    forwardHeaders.set("Host", "f005.backblazeb2.com");

    try {
      const b2Response = await fetch(targetUrl, {
        method: request.method,
        headers: forwardHeaders,
        cf: {
          cacheEverything: true,
          cacheTtl: 2592000 // Cache for 30 days at Cloudflare edge
        }
      });

      const responseHeaders = new Headers(b2Response.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      responseHeaders.set("Access-Control-Allow-Headers", "Range, Content-Type");
      responseHeaders.set(
        "Access-Control-Expose-Headers",
        "Content-Range, Content-Length, Accept-Ranges, Content-Disposition"
      );

      // Force Download if ?download query parameter is present
      if (url.searchParams.has("download")) {
        const rawName = url.pathname.split("/").pop() || "movie.mp4";
        let cleanName = decodeURIComponent(rawName).replace(/["\r\n]/g, "");
        responseHeaders.set(
          "Content-Disposition",
          `attachment; filename="${cleanName}"`
        );
      }

      return new Response(b2Response.body, {
        status: b2Response.status,
        statusText: b2Response.statusText,
        headers: responseHeaders
      });
    } catch (err) {
      return new Response("Error streaming from Backblaze: " + err.message, { status: 502 });
    }
  }
};
