import type { NextConfig } from "next";

import createNextIntlPlugin from "next-intl/plugin";

// Where this server reaches the API. In production Caddy routes /api itself;
// this rewrite covers local development and `next start` without Caddy.
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    // Same-origin API (ADR-006): the browser only ever talks to this site, so
    // the session cookie belongs to it and no CORS is involved.
    return [{ source: "/api/:path*", destination: `${API_INTERNAL_URL}/api/:path*` }];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
