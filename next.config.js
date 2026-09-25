const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      // /features was merged into /about — keep old bookmarks working
      { source: "/features", destination: "/about", permanent: true },
      { source: "/features/:path*", destination: "/about", permanent: true },
    ];
  },
  async headers() {
    // CSP is set dynamically per-request in src/middleware.ts with a cryptographic nonce.
    // Static fallback must include unsafe-inline/unsafe-eval or the page white-screens when middleware
    // hasn't yet injected the nonce (e.g. during Turbopack HMR or static fallback). Middleware's
    // runtime header overrides this, so keep fallback permissive to avoid blocking.
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-src 'self' https://www.openstreetmap.org",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  // Never expose stack traces or source maps to the client in production
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
