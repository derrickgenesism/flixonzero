export default {
  async fetch(request) {
    // 1. Handle CORS Preflight for web players and apps
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

    // 2. Health check / Root response
    if (!url.pathname || url.pathname === "/") {
      return new Response("FlixOn Video CDN Active", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // 3. Map path to Backblaze B2 public endpoint (Bandwidth Alliance = $0 Egress)
    const b2Origin = "https://f005.backblazeb2.com/file/flixonvideos";
    const targetUrl = new URL(b2Origin + url.pathname);

    // 4. Forward original headers (Range header for video scrubbing & seeking)
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

      // 5. Build response headers with CORS and player support
      const responseHeaders = new Headers(b2Response.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      responseHeaders.set("Access-Control-Allow-Headers", "Range, Content-Type");
      responseHeaders.set(
        "Access-Control-Expose-Headers",
        "Content-Range, Content-Length, Accept-Ranges, Content-Disposition"
      );

      // 6. Force Download if ?download query parameter is present
      // Example: https://cdn.flixon.net/movie.mp4?download=1
      if (url.searchParams.has("download")) {
        const rawName = url.pathname.split("/").pop() || "movie.mp4";
        let cleanName = decodeURIComponent(rawName);
        cleanName = cleanName.replace(/["\r\n]/g, "");
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
