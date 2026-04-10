export type TrackCategory = {
  slug: string;
  labelFr: string;
  labelEn: string;
  type: "STYLE" | "THEME" | "MOOD";
};

/** Track enrichi pour le frontend (join artists + categories) */
export type TrackWithDetails = {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  durationSeconds: number | null;
  bpm: number | null;
  coverUrl: string | null;
  previewPath: string | null;
  fullPath: string | null;
  categories: TrackCategory[];
  /** ISO string — kept JSON-serializable for the RSC boundary */
  createdAt: string | null;
  /** True if this track is in the top N most recently uploaded — set by the catalogue page */
  isNew?: boolean;
};

/** Track allégé pour le player Zustand */
export type PlayerTrack = {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  durationSeconds: number;
  coverUrl: string | null;
  previewPath: string | null;
  fullPath: string | null;
};
