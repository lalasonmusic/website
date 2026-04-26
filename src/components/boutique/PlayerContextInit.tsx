"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";

type Props = {
  hasBoutiqueAccess: boolean;
};

const PREVIEW_LIMIT_SEC = 30;

/**
 * Headless component mounted on boutique pages (hub + détail).
 * - At mount: tags the player store with the boutique context so the audio
 *   element knows to apply the 30s cut and disable auto-chain.
 * - At unmount (user leaves the section): resets those flags so navigating
 *   to /catalogue or anywhere else restores normal playback behaviour.
 *
 * `hasBoutiqueAccess` is computed server-side and passed as a prop —
 * never fetched client-side, to avoid flicker on first paint.
 */
export default function PlayerContextInit({ hasBoutiqueAccess }: Props) {
  const setHasBoutiqueAccess = usePlayerStore((s) => s.setHasBoutiqueAccess);
  const setPreviewLimitSec = usePlayerStore((s) => s.setPreviewLimitSec);
  const setActivePlaylistAudience = usePlayerStore((s) => s.setActivePlaylistAudience);
  const setIsPreviewEnded = usePlayerStore((s) => s.setIsPreviewEnded);

  useEffect(() => {
    setHasBoutiqueAccess(hasBoutiqueAccess);
    setPreviewLimitSec(hasBoutiqueAccess ? null : PREVIEW_LIMIT_SEC);
    setActivePlaylistAudience("boutique");
    return () => {
      setPreviewLimitSec(null);
      setActivePlaylistAudience(null);
      setIsPreviewEnded(false);
      // Note: we don't reset hasBoutiqueAccess on unmount — it reflects the
      // actual user state and the player keeps it accurate for the next page.
    };
  }, [hasBoutiqueAccess, setHasBoutiqueAccess, setPreviewLimitSec, setActivePlaylistAudience, setIsPreviewEnded]);

  return null;
}
