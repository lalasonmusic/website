import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

type SeedPlaylist = {
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  gradient: string;
  emoji: string;
  // matching strategy: tracks must have AT LEAST one category from each non-empty list
  styles?: string[]; // category slugs
  moods?: string[];
  themes?: string[];
  maxTracks?: number;
};

const PLAYLISTS: SeedPlaylist[] = [
  {
    slug: "cafe-matin",
    nameFr: "Café Matin",
    nameEn: "Morning Coffee",
    descriptionFr: "Acoustique et lo-fi pour un réveil en douceur",
    descriptionEn: "Acoustic and lo-fi for a gentle wake-up",
    gradient: "linear-gradient(135deg, #f5a623 0%, #d4731c 100%)",
    emoji: "☕",
    styles: ["lofi", "chill-out", "funk-jazz"],
    moods: ["calme", "heureux"],
    maxTracks: 30,
  },
  {
    slug: "restaurant-soiree",
    nameFr: "Restaurant Soirée",
    nameEn: "Dinner Vibes",
    descriptionFr: "Jazz et lounge pour vos soirées",
    descriptionEn: "Jazz and lounge for your evenings",
    gradient: "linear-gradient(135deg, #6b0f1a 0%, #2a0509 100%)",
    emoji: "🍷",
    styles: ["funk-jazz", "chill-out"],
    moods: ["calme", "romantique"],
    maxTracks: 30,
  },
  {
    slug: "boutique-mode",
    nameFr: "Boutique Mode",
    nameEn: "Fashion Boutique",
    descriptionFr: "Pop, électro et hip-hop pour vos clients tendance",
    descriptionEn: "Pop, electro and hip-hop for your trendy customers",
    gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    emoji: "🛍️",
    styles: ["pop-rock", "electronique", "hip-hop-urban"],
    moods: ["heureux", "energique"],
    maxTracks: 30,
  },
  {
    slug: "salon-bien-etre",
    nameFr: "Salon Bien-être",
    nameEn: "Wellness Spa",
    descriptionFr: "Ambient et méditation pour la détente totale",
    descriptionEn: "Ambient and meditation for total relaxation",
    gradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
    emoji: "🧘",
    styles: ["chill-out"],
    themes: ["meditation"],
    moods: ["calme"],
    maxTracks: 30,
  },
  {
    slug: "sport-fitness",
    nameFr: "Sport & Fitness",
    nameEn: "Sport & Fitness",
    descriptionFr: "Énergie et motivation pour vos entraînements",
    descriptionEn: "Energy and motivation for your workouts",
    gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
    emoji: "💪",
    styles: ["electronique", "hip-hop-urban", "pop-rock"],
    themes: ["sport"],
    moods: ["energique"],
    maxTracks: 30,
  },
  {
    slug: "happy-hour",
    nameFr: "Happy Hour",
    nameEn: "Happy Hour",
    descriptionFr: "Funk et grooves pour une ambiance festive",
    descriptionEn: "Funk and grooves for a festive vibe",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
    emoji: "🍹",
    styles: ["funk-jazz", "pop-rock"],
    moods: ["heureux", "energique"],
    maxTracks: 30,
  },
  {
    slug: "coworking-focus",
    nameFr: "Coworking Focus",
    nameEn: "Coworking Focus",
    descriptionFr: "Lo-fi et électro pour la concentration",
    descriptionEn: "Lo-fi and electronic for focus",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
    emoji: "💻",
    styles: ["lofi", "electronique", "chill-out"],
    moods: ["calme"],
    maxTracks: 30,
  },
  {
    slug: "voyage-nature",
    nameFr: "Voyage & Nature",
    nameEn: "Travel & Nature",
    descriptionFr: "Ambiances cinématiques et world music",
    descriptionEn: "Cinematic and world music vibes",
    gradient: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
    emoji: "🌍",
    styles: ["cinematique", "world"],
    themes: ["voyage-nature"],
    maxTracks: 30,
  },
];

async function main() {
  console.log("Seeding playlists...\n");

  // Get all categories with their IDs
  const categories = await sql`SELECT id, slug FROM categories`;
  const catMap = new Map(categories.map((c) => [c.slug as string, c.id as string]));

  for (let i = 0; i < PLAYLISTS.length; i++) {
    const p = PLAYLISTS[i];
    process.stdout.write(`[${i + 1}/${PLAYLISTS.length}] ${p.nameFr}... `);

    // Insert/upsert playlist
    const existing = await sql`SELECT id FROM playlists WHERE slug = ${p.slug}`;

    let playlistId: string;
    if (existing.length > 0) {
      playlistId = existing[0].id as string;
      await sql`
        UPDATE playlists SET
          name_fr = ${p.nameFr},
          name_en = ${p.nameEn},
          description_fr = ${p.descriptionFr},
          description_en = ${p.descriptionEn},
          gradient = ${p.gradient},
          emoji = ${p.emoji},
          display_order = ${i},
          updated_at = NOW()
        WHERE id = ${playlistId}
      `;
    } else {
      const inserted = await sql`
        INSERT INTO playlists (slug, name_fr, name_en, description_fr, description_en, gradient, emoji, display_order)
        VALUES (${p.slug}, ${p.nameFr}, ${p.nameEn}, ${p.descriptionFr}, ${p.descriptionEn}, ${p.gradient}, ${p.emoji}, ${i})
        RETURNING id
      `;
      playlistId = inserted[0].id as string;
    }

    // Build category filter
    const catSlugs = [...(p.styles ?? []), ...(p.themes ?? []), ...(p.moods ?? [])];
    const catIds = catSlugs.map((s) => catMap.get(s)).filter(Boolean) as string[];

    if (catIds.length === 0) {
      console.log("SKIP (no categories)");
      continue;
    }

    // Find tracks matching ANY of these categories
    const matchingTracks = await sql`
      SELECT id FROM (
        SELECT DISTINCT t.id
        FROM tracks t
        JOIN track_categories tc ON tc.track_id = t.id
        WHERE t.is_published = true
          AND tc.category_id = ANY(${catIds})
      ) AS distinct_tracks
      ORDER BY RANDOM()
      LIMIT ${p.maxTracks ?? 30}
    `;

    // Clear existing playlist_tracks
    await sql`DELETE FROM playlist_tracks WHERE playlist_id = ${playlistId}`;

    // Insert new tracks
    for (let pos = 0; pos < matchingTracks.length; pos++) {
      await sql`
        INSERT INTO playlist_tracks (playlist_id, track_id, position)
        VALUES (${playlistId}, ${matchingTracks[pos].id}, ${pos})
        ON CONFLICT DO NOTHING
      `;
    }

    console.log(`OK (${matchingTracks.length} tracks)`);
  }

  console.log("\n=== Done ===");
  await sql.end();
}

main().catch(console.error);
