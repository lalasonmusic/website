export const ARTIST_PHOTOS: Record<string, string> = {
  "allan": "/artists/allan.jpg",
  "avalanche-pulse": "/artists/avalanche-pulse.jpg",
  "boris-massot": "/artists/boris-massot.jpg",
  "corine-besnard": "/artists/corine-besnard.jpg",
  "cyril-girard": "/artists/cyril-girard.jpg",
  "djobeer": "/artists/djobeer.jpg",
  "groovyd": "/artists/groovyd.jpg",
  "jaxsyn": "/artists/jaxsyn.jpg",
  "kaelixx": "/artists/kaelixx.jpg",
  "konqeson": "/artists/konqeson.jpg",
  "marco": "/artists/marco-ariani.jpg",
  "midnight-blaze": "/artists/midnight-blaze.jpg",
  "nyvvik": "/artists/nyvvik.jpg",
  "quynzelle": "/artists/quynzelle.jpg",
  "vdgl": "/artists/vdgl.jpg",
  "vendredi": "/artists/vendredi.jpg",
  "wobbletronix": "/artists/wobbletronix.jpg",
};

export function getArtistPhoto(slug: string, photoUrl?: string | null): string | null {
  return photoUrl || ARTIST_PHOTOS[slug] || null;
}
