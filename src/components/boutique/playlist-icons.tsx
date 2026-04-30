import { Scissors, Sparkles, Flower2, PawPrint, Smile, Hand, Brain } from "lucide-react";
import type { ReactNode } from "react";

// Maps DB slug → Lucide icon component for boutique playlists.
// Uses Lucide instead of native emojis to keep the brand premium and
// consistent with the home page features section.

const ICON_PROPS = { size: 28, strokeWidth: 1.75, color: "currentColor" } as const;

const ICON_BY_SLUG: Record<string, ReactNode> = {
  "salon-coiffure": <Scissors {...ICON_PROPS} />,
  "institut-beaute": <Sparkles {...ICON_PROPS} />,
  "spa-massage": <Flower2 {...ICON_PROPS} />,
  "cabinet-veterinaire": <PawPrint {...ICON_PROPS} />,
  "cabinet-dentaire": <Smile {...ICON_PROPS} />,
  "osteopathe-kine": <Hand {...ICON_PROPS} />,
  "cabinet-psychologue": <Brain {...ICON_PROPS} />,
};

export function getBoutiqueIcon(dbSlug: string): ReactNode | null {
  return ICON_BY_SLUG[dbSlug] ?? null;
}
