import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Keep packages that ship native binaries (ffmpeg, ffprobe) external to the
  // Next.js server bundle so webpack doesn't try to parse their binary files.
  serverExternalPackages: [
    "fluent-ffmpeg",
    "ffmpeg-static",
    "@ffprobe-installer/ffprobe",
  ],
  // next/image remote source allowlist. Required for any non-/public image
  // served through <Image>. Specific paths used so we don't open the proxy
  // to arbitrary subdomains.
  images: {
    remotePatterns: [
      // Curated Unsplash photos used by the boutique playlist cards/heros.
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // Supabase Storage public buckets (track covers, playlist images,
      // audio-previews art, etc.). The hostname segment is the Supabase
      // project ref — kept as a wildcard so this still works if a sibling
      // env (preview/prod) ever points to a different project.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      // Google avatar from OAuth sign-in (shown in user menu / member area).
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      // YouTube thumbnails for LiteYouTube embeds on the home page.
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },
      // Wix-hosted blog cover images — legacy from the migration. Posts
      // imported from the Wix site still point coverUrl at static.wixstatic.com.
      { protocol: "https", hostname: "static.wixstatic.com", pathname: "/**" },
    ],
  },
  // Force Vercel's file tracer to include native binaries that are loaded via
  // dynamic `require.resolve` (platform-specific). Without this, @ffprobe-installer
  // throws at module import on Vercel because the binary file isn't in the lambda.
  outputFileTracingIncludes: {
    "/api/admin/tracks/bulk-upload": [
      "./node_modules/@ffprobe-installer/**/*",
      "./node_modules/ffmpeg-static/ffmpeg",
      "./node_modules/ffmpeg-static/ffmpeg.exe",
    ],
    "/api/tracks/[id]/wav": [
      "./node_modules/@ffprobe-installer/**/*",
      "./node_modules/ffmpeg-static/ffmpeg",
      "./node_modules/ffmpeg-static/ffmpeg.exe",
    ],
  },
  redirects: async () => [
    // ── Blog : ancien préfixe Wix → nouveau préfixe ──
    {
      source: "/blog-musique-libre-de-droits",
      destination: "/fr/blog",
      permanent: true,
    },
    {
      source: "/blog-musique-libre-de-droits/:slug",
      destination: "/fr/blog/:slug",
      permanent: true,
    },

    // ── Pages statiques sans locale ──
    {
      source: "/abonnements",
      destination: "/fr/abonnements",
      permanent: true,
    },
    {
      source: "/nos-artistes",
      destination: "/fr/nos-artistes",
      permanent: true,
    },
    {
      source: "/contact",
      destination: "/fr/contact",
      permanent: true,
    },
    {
      source: "/mentions-legales",
      destination: "/fr/mentions-legales",
      permanent: true,
    },
    {
      source: "/politique-de-confidentialite",
      destination: "/fr/politique-de-confidentialite",
      permanent: true,
    },

    // ── Anciennes pages Wix dupliquées → abonnements ──
    {
      source: "/copie-de-nos-offres",
      destination: "/fr/abonnements",
      permanent: true,
    },
    {
      source: "/copie-de-nos-offres-1",
      destination: "/fr/abonnements",
      permanent: true,
    },
    {
      source: "/musique-pour-createur-de-contenus",
      destination: "/fr/abonnements",
      permanent: true,
    },
    {
      source: "/abonnement-musiques-en-boutique",
      destination: "/fr/abonnements",
      permanent: true,
    },

    // ── Catalogue par style ──
    {
      source: "/par-style",
      destination: "/fr/catalogue",
      permanent: true,
    },
    {
      source: "/par-style/:slug",
      destination: "/fr/catalogue?style=:slug",
      permanent: true,
    },
    {
      source: "/pop-rock",
      destination: "/fr/catalogue?style=pop-rock",
      permanent: true,
    },

    // ── Catalogue par humeur ──
    {
      source: "/par-humeur",
      destination: "/fr/catalogue",
      permanent: true,
    },
    {
      source: "/par-humeur/:slug",
      destination: "/fr/catalogue?mood=:slug",
      permanent: true,
    },

    // ── Catalogue par thème ──
    {
      source: "/par-theme",
      destination: "/fr/catalogue",
      permanent: true,
    },
    {
      source: "/par-theme/:slug",
      destination: "/fr/catalogue?theme=:slug",
      permanent: true,
    },
  ],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://eu.i.posthog.com https://va.vercel-scripts.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https://eu.i.posthog.com https://*.supabase.co https://api.stripe.com https://vitals.vercel-insights.com",
            "frame-src https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://www.youtube-nocookie.com",
            "media-src 'self' https://*.supabase.co blob:",
          ].join("; "),
        },
      ],
    },
  ],
};

export default withNextIntl(nextConfig);
