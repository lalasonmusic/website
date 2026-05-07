import type { Metadata } from "next";

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lalason.com";

const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

type BuildMetadataParams = {
  /** Page title — will be used as-is for <title> (root layout template adds "| Lalason") */
  title: string;
  description?: string;
  locale: string;
  /** Path WITHOUT locale prefix: "/" | "/catalogue" | "/blog/slug" */
  pagePath: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description,
  locale,
  pagePath,
  image,
  type = "website",
  noIndex = false,
}: BuildMetadataParams): Metadata {
  const altLocale = locale === "fr" ? "en" : "fr";
  const normalizedPath = pagePath === "/" ? "" : pagePath;

  const url = `${BASE_URL}/${locale}${normalizedPath}`;
  const altUrl = `${BASE_URL}/${altLocale}${normalizedPath}`;
  const ogImage = image ?? DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        [locale]: url,
        [altLocale]: altUrl,
        "x-default": `${BASE_URL}/fr${normalizedPath}`,
      },
    },
    openGraph: {
      title: `${title} | Lalason`,
      description,
      url,
      siteName: "Lalason",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      type,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Lalason`,
      description,
      images: [ogImage],
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}

type BuildOgUrlParams = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  /** Absolute https URL to a background photo */
  image?: string;
};

/**
 * Builds an absolute URL to the `/api/og` dynamic image generator. Used as
 * the `image` parameter to `buildMetadata` on detail pages that benefit
 * from a personalised OG image (blog posts, boutique playlists, artists).
 *
 * Social scrapers (FB / Twitter / LinkedIn / WhatsApp) need an absolute
 * URL, hence the BASE_URL prefix — a relative path would fail validation.
 */
export function buildDynamicOgUrl(p: BuildOgUrlParams): string {
  const params = new URLSearchParams();
  params.set("title", p.title);
  if (p.eyebrow) params.set("eyebrow", p.eyebrow);
  if (p.subtitle) params.set("subtitle", p.subtitle);
  if (p.image) params.set("image", p.image);
  return `${BASE_URL}/api/og?${params.toString()}`;
}
