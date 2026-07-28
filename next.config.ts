import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withPayload } from "@payloadcms/next/withPayload";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Content-Security-Policy.
 *
 * Measured, not guessed: a crawl of every page type found exactly one external
 * origin — the Carto basemap tiles the route map draws on. Everything else is
 * same-origin.
 *
 * `script-src` has to allow inline. Nearly every page here is statically
 * generated, and a nonce cannot be baked into a prerendered document — a
 * nonce-based policy would mean making the whole site dynamic, which costs far
 * more than it buys. So the XSS value of this policy comes from the directives
 * below `script-src`: form-action stops a hijacked form posting elsewhere,
 * base-uri stops a <base> tag rewriting every relative URL, object-src kills
 * plugin execution, and frame-ancestors backs up X-Frame-Options.
 *
 * Shipped as Report-Only first and promoted only after a live crawl showed no
 * violations. Read the header name below to see which mode is active.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.public.blob.vercel-storage.com https://images.unsplash.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.public.blob.vercel-storage.com",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  experimental: {
    // Required for src/app/global-not-found.tsx. This app has three root
    // layouts and a top-level dynamic segment, which Next documents as the
    // case where a route-level not-found cannot compose a 404 — confirmed by
    // testing. Scope is limited to 404 handling: if the flag misbehaves the
    // fallback is Next's default page, which is what we have today anyway.
    globalNotFound: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy-Report-Only", value: csp },
          // Nothing here uses a camera, microphone or location, so the browser
          // should refuse those outright rather than leave them available to
          // injected script or an embedded frame.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default withPayload(withNextIntl(nextConfig));
