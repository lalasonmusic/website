// Hardcoded curated Unsplash photos per vertical for the boutique playlist cards.
// Hotlinked from images.unsplash.com (allowed by Unsplash terms with utm tracking).
// Emil can swap any URL here without touching the schema. Future: move to a DB
// column `image_url` on playlists with admin-side editing.

const UTM = "&utm_source=lalason&utm_medium=referral";

const IMAGE_BY_SLUG: Record<string, string> = {
  "salon-coiffure": `https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=75&auto=format&fit=crop${UTM}`,
  "institut-beaute": `https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=75&auto=format&fit=crop${UTM}`,
  "spa-massage": `https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=75&auto=format&fit=crop${UTM}`,
  "cabinet-veterinaire": `https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&q=75&auto=format&fit=crop${UTM}`,
  "cabinet-dentaire": `https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=75&auto=format&fit=crop${UTM}`,
  "osteopathe-kine": `https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=75&auto=format&fit=crop${UTM}`,
  "cabinet-psychologue": `https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=75&auto=format&fit=crop${UTM}`,
};

export function getBoutiqueImage(dbSlug: string): string | null {
  return IMAGE_BY_SLUG[dbSlug] ?? null;
}
