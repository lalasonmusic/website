import { BASE_URL } from "@/lib/seo";

type BreadcrumbCrumb = {
  /** Display label */
  name: string;
  /** Path WITHOUT the locale prefix, e.g. "/blog" or "/musique-ambiance/salon-coiffure" */
  path: string;
};

/**
 * Builds a schema.org BreadcrumbList JSON-LD object for a detail page.
 * Pass the locale + the trail (Home is added automatically as the first item).
 *
 * Google can render the breadcrumb directly in the SERP (clickable trail
 * shown above the URL). Adds context + extra CTR on long-tail queries.
 */
export function buildBreadcrumbJsonLd(locale: string, crumbs: BreadcrumbCrumb[]) {
  const homeName = locale === "en" ? "Home" : "Accueil";
  const all: BreadcrumbCrumb[] = [{ name: homeName, path: "" }, ...crumbs];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${BASE_URL}/${locale}${c.path}`,
    })),
  };
}
