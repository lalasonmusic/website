// Mapping between locale-specific URL slugs and the canonical DB slug.
// The DB slug is always the French slug (matches the `playlists.slug` column).
// For new boutique playlists, add an entry here AND seed the DB with the FR slug.

type Locale = "fr" | "en";

const SLUG_FR_TO_EN: Record<string, string> = {
  "salon-coiffure": "hair-salon",
  "institut-beaute": "beauty-salon",
  "spa-massage": "spa-massage",
  "cabinet-veterinaire": "veterinary-clinic",
  "cabinet-dentaire": "dental-clinic",
  "osteopathe-kine": "osteopath-physio",
  "cabinet-psychologue": "therapist-office",
};

const SLUG_EN_TO_FR: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_FR_TO_EN).map(([fr, en]) => [en, fr]),
);

/**
 * Resolves a locale-specific URL slug to the canonical DB slug (always FR).
 * Returns null if the slug is unknown for that locale.
 */
export function resolveSlugToDb(localeSlug: string, locale: Locale): string | null {
  if (locale === "fr") {
    return localeSlug in SLUG_FR_TO_EN ? localeSlug : null;
  }
  return SLUG_EN_TO_FR[localeSlug] ?? null;
}

/**
 * Resolves a DB slug (canonical FR) to the locale-specific URL slug.
 * Returns null if the slug doesn't exist in the boutique map.
 */
export function resolveDbToSlug(dbSlug: string, locale: Locale): string | null {
  if (locale === "fr") {
    return dbSlug in SLUG_FR_TO_EN ? dbSlug : null;
  }
  return SLUG_FR_TO_EN[dbSlug] ?? null;
}

/**
 * Returns all locale-specific slugs for the given locale (used by generateStaticParams).
 */
export function getAllSlugsForLocale(locale: Locale): string[] {
  if (locale === "fr") return Object.keys(SLUG_FR_TO_EN);
  return Object.values(SLUG_FR_TO_EN);
}
