import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// Lalason brand palette
const BRAND_NAVY = "#0f2533";
const BRAND_NAVY_LIGHT = "#1b3a4b";
const BRAND_ACCENT = "#f5a623";

const SIZE = { width: 1200, height: 630 };

/**
 * Dynamic Open Graph image generator.
 *
 * Query params:
 *   title    (required)         — main heading, large
 *   eyebrow  (optional)         — small uppercase tag above title (e.g. "Musique d'ambiance", "Article")
 *   subtitle (optional)         — secondary line under title (e.g. "3 morceaux · Démo : ...")
 *   image    (optional, https)  — background photo. Will be tinted with a dark
 *                                 gradient so the text stays legible.
 *
 * Cached aggressively (immutable) so Facebook / Twitter / LinkedIn / WhatsApp
 * scrapers hit Vercel's CDN, not the lambda, on subsequent shares.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const title = params.get("title") ?? "Lalason";
  const eyebrow = params.get("eyebrow");
  const subtitle = params.get("subtitle");
  const image = params.get("image");

  // Truncate title gracefully — keeps the layout from blowing up on long titles
  const safeTitle = title.length > 90 ? title.slice(0, 87) + "…" : title;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${BRAND_NAVY} 0%, ${BRAND_NAVY_LIGHT} 100%)`,
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Background photo (if any) */}
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Dark gradient overlay so text stays legible regardless of photo */}
        {image && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              background:
                "linear-gradient(135deg, rgba(15,37,51,0.85) 0%, rgba(27,58,75,0.55) 50%, rgba(15,37,51,0.95) 100%)",
            }}
          />
        )}

        {/* Top bar — wordmark + accent rule */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            padding: "56px 72px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "white",
            }}
          >
            Lalason
          </div>
          <div
            style={{
              marginLeft: 18,
              width: 44,
              height: 4,
              borderRadius: 2,
              background: BRAND_ACCENT,
            }}
          />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, display: "flex" }} />

        {/* Title block — anchored bottom-left */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "0 72px 64px",
            maxWidth: 1080,
          }}
        >
          {eyebrow && (
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: BRAND_ACCENT,
                marginBottom: 20,
              }}
            >
              {eyebrow}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: safeTitle.length > 50 ? 64 : 80,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "white",
              textShadow: image ? "0 4px 24px rgba(0,0,0,0.4)" : "none",
            }}
          >
            {safeTitle}
          </div>
          {subtitle && (
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 500,
                color: "rgba(255,255,255,0.85)",
                marginTop: 24,
                textShadow: image ? "0 2px 12px rgba(0,0,0,0.4)" : "none",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        // Cache for 1 year on the CDN; social scrapers cache too
        "Cache-Control": "public, immutable, no-transform, max-age=31536000",
      },
    },
  );
}
