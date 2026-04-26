# Plan Technique : Section publique "Musique d'ambiance"

**Date** : 2026-04
**Statut** : Draft
**Branche** : `feat/musique-ambiance-boutique`
**PRD source** : [`prd.md`](./prd.md)

---

## Résumé exécutif

Feature en **9 epics** / ~25 stories / ~80 tasks. ~70% réutilisation de l'infra (DB schema playlists, store Zustand, admin CRUD, pattern SSR catalogue, pattern popup). ~30% création (pages publiques, mécanique 30s côté player, migration enum + index partiel, popup boutique, routing pathnames next-intl, traductions FR+EN).

**Risques techniques principaux** :
1. Migration vers `pathnames` next-intl v4 (premier usage dans le repo) — peut affecter le routing existant si mal configuré.
2. Coupure 30s côté player — nécessite de modifier `PlayerDesktop`/`PlayerMobileMini` qui contiennent l'élément `<audio>` HTML (pas encore inspectés en détail).
3. Migration DB : la table `playlists` n'a pas de fichier SQL dans `src/db/migrations/` aujourd'hui (gérée via `drizzle-kit push` apparemment). Ma migration ajoute `audience` enum + `is_demo` boolean + index unique partiel — il faudra peut-être consolider.

---

## Architecture Proposée

### Vue d'ensemble du flow technique

```
Visiteur arrive sur /fr/musique-ambiance/salon-coiffure
       ↓
Server Component (Next.js App Router)
   - Détecte locale via params
   - Map slug localisé (hair-salon → salon-coiffure) via next-intl pathnames
   - Query Drizzle direct : playlists WHERE slug = ? AND audience = 'boutique' AND is_published = true
   - Query subscription user (server-side) → calcule hasBoutiqueAccess
   - Render SSG (revalidate 3600) → HTML pré-rendu pour SEO
       ↓
Page renvoie :
   - HTML statique (h1, meta, schema.org JSON-LD)
   - Liste de tracks avec badge demo
   - <BoutiqueSubscriptionPopup hasBoutiqueAccess={...} />
   - <PlayerInitClient hasBoutiqueAccess={...} previewLimitSec={30} activePlaylistAudience="boutique" />
       ↓
Client side :
   - User clique play → playTrack() update store
   - PlayerDesktop écoute timeupdate sur <audio>
   - Si store.previewLimitSec && currentTime >= previewLimitSec && !track.isDemo && !hasBoutiqueAccess
       → audio.pause() + setIsPreviewEnded(true) + toast CTA
```

### Composants

| Composant / Fichier | Type | Action | Description |
|---|---|---|---|
| `src/db/schema/playlists.ts` | Existant | Modifier | Ajouter `audience` enum + `is_demo` sur join |
| `src/db/schema/index.ts` | Existant | Vérifier | Exporter le nouveau enum |
| `src/db/migrations/0004_*.sql` | Nouveau | Créer | Migration enum + colonne + unique index partiel + seed 7 playlists |
| `src/i18n/routing.ts` | Existant | Modifier | Ajouter `pathnames` config pour slugs FR/EN |
| `src/i18n/pathnames.ts` | Nouveau | Créer | Config dédiée pathnames (séparée pour clarté) |
| `messages/fr.json` + `messages/en.json` | Existant | Modifier | Ajouter clés nav + section + popup |
| `src/components/layout/Header.tsx` | Existant | Modifier | Ajouter entrée "Musique d'ambiance" |
| `src/components/layout/MobileMenu.tsx` | Existant | Modifier | Idem MobileMenu |
| `src/app/[locale]/musique-ambiance/page.tsx` | Nouveau | Créer | Hub : grid des 7 playlists (SSG, revalidate 3600) |
| `src/app/[locale]/musique-ambiance/[slug]/page.tsx` | Nouveau | Créer | Détail : header + tracks + CTAs |
| `src/components/boutique/BoutiquePlaylistCard.tsx` | Nouveau | Créer | Carte hub (gradient + emoji + nom + count) |
| `src/components/boutique/BoutiqueTrackList.tsx` | Nouveau | Créer | Liste de tracks avec badge demo + play |
| `src/components/boutique/BoutiqueSubscriptionPopup.tsx` | Nouveau | Créer | Popup 15s, 1 carte 99,99€/an, sessionStorage |
| `src/components/boutique/EmptyPlaylistState.tsx` | Nouveau | Créer | État vide ("playlist en cours de curation") |
| `src/components/boutique/PreviewEndedToast.tsx` | Nouveau | Créer | Toast persistante "extrait limité" + CTA |
| `src/components/boutique/PlayerContextInit.tsx` | Nouveau | Créer | Client component qui pose les flags playlist boutique dans le store au mount |
| `src/store/playerStore.ts` | Existant | Modifier | Ajouter `previewLimitSec`, `isPreviewEnded`, `hasBoutiqueAccess`, `activePlaylistAudience` |
| `src/components/player/PlayerDesktop.tsx` | Existant | Modifier | Hook timer `timeupdate` pour coupure 30s |
| `src/components/player/PlayerMobileMini.tsx` | Existant | Modifier | Idem |
| `src/components/admin/PlaylistEditor.tsx` | Existant | Modifier | Sélecteur audience + checkbox démo par track + warning |
| `src/app/api/admin/playlists/[id]/route.ts` | Existant | Modifier | PATCH accepte `audience` |
| `src/app/api/admin/playlists/[id]/tracks/[trackId]/route.ts` | Nouveau | Créer | PATCH pour set `is_demo` (avec reset des autres) |
| `src/app/api/playlists/route.ts` | Existant | Vérifier | Reste rétrocompat (utilisé par espace membre) |
| `src/lib/playlists/queries.ts` | Nouveau | Créer | Helper server-side : `getBoutiquePlaylists()`, `getBoutiquePlaylistBySlug()` |
| `src/lib/subscriptions/access.ts` | Nouveau | Créer | Helper : `getUserAccess(userId)` retourne `{ hasBoutiqueAccess, hasCreatorAccess, isSubscribed }` |

### Flow des données — résumé

- **Données statiques** : seed des 7 playlists boutique en DB (1 migration, exécutée 1 fois)
- **Données dynamiques** : nom, description, gradient, emoji, ordre — édité dans l'admin existant (étendu avec `audience` field)
- **Données runtime** : tracks d'une playlist (curation manuelle Emil après deploy via admin), `is_demo` flag (admin)
- **Données utilisateur** : subscription plan type → résolu côté serveur → passé en prop SSR au client

---

## Décisions Techniques

### Décision 1 : Routing localisé (slugs FR ≠ EN)

**Contexte** : la PRD veut `/fr/musique-ambiance/salon-coiffure` ↔ `/en/ambient-music/hair-salon`. Aujourd'hui le repo utilise `localePrefix: "always"` mais sans `pathnames` custom — toutes les routes ont le même slug entre FR et EN.

**Options considérées** :

| Option | Avantages | Inconvénients | Effort |
|---|---|---|---|
| A. `pathnames` next-intl v4 (slugs différents par locale) | SEO optimal (mot-clé URL = mot-clé requête en chaque langue), pattern officiel next-intl, type-safe | Premier usage dans le repo (apprentissage), nécessite update `routing.ts` | Moyen |
| B. Même slug partout (`salon-coiffure` en FR ET EN) | Zéro changement à `routing.ts`, plus simple à maintenir | SEO anglais sous-optimal (Google EN ne va pas associer "hair salon" à "salon-coiffure") | Faible |
| C. Slugs séparés en DB (colonnes `slugFr`, `slugEn`) + dispatch manuel | Slugs gérés via admin, pas via config code | Refonte queries, complexité ajoutée, perte du type-safety next-intl | Élevé |

**Recommandation** : **Option A** — pattern officiel next-intl v4, gain SEO réel sur les requêtes EN, type-safe. La config `pathnames` reste centralisée dans `src/i18n/pathnames.ts`. Si plus tard on veut éditorialiser les slugs depuis l'admin, on migrera vers C — mais en v1, hardcoder dans le code est plus rapide et plus sûr.

**Implémentation** :
```typescript
// src/i18n/pathnames.ts
import type { Pathnames } from "next-intl/routing";
import { routing } from "./routing";

export const pathnames = {
  "/": "/",
  "/catalogue": "/catalogue",
  // ... routes existantes (même slug FR/EN)
  "/musique-ambiance": {
    fr: "/musique-ambiance",
    en: "/ambient-music",
  },
  "/musique-ambiance/[slug]": {
    fr: "/musique-ambiance/[slug]",
    en: "/ambient-music/[slug]",
  },
} satisfies Pathnames<typeof routing.locales>;
```

**Important** : le segment `[slug]` reste dynamique côté Next.js. Le mapping FR↔EN du slug lui-même (ex: `salon-coiffure` ↔ `hair-salon`) est fait au niveau du **slug DB** : on stocke un seul slug canonique en DB (`salon-coiffure`) et on map dans une **table de constantes côté code** :

```typescript
// src/lib/boutique/slug-mapping.ts
export const BOUTIQUE_SLUG_MAP = {
  fr: {
    "salon-coiffure": "salon-coiffure",
    "institut-beaute": "institut-beaute",
    "spa-massage": "spa-massage",
    // ...
  },
  en: {
    "hair-salon": "salon-coiffure",
    "beauty-salon": "institut-beaute",
    "spa-massage": "spa-massage",
    // ...
  },
} as const;
```

La page détail reçoit `params.slug` (slug locale-specific), résout vers le slug DB via la map, query Drizzle.

---

### Décision 2 : Stratégie de cache des pages publiques

**Contexte** : SEO = priorité #1. Les pages doivent être rapides et indexables.

**Options considérées** :

| Option | Avantages | Inconvénients | Effort |
|---|---|---|---|
| A. SSG via `generateStaticParams` + `revalidate: 3600` | HTML pré-rendu (parfait pour Google), CDN-cacheable, performances max | Build doit connaître les 7 slugs (OK, ils sont fixes) | Faible |
| B. ISR `dynamic = 'auto'` + `revalidate: 60` | Plus frais (1 min), moins de blocage si nouvelle playlist ajoutée | Plus de hits DB | Faible |
| C. `force-dynamic` (comme `/catalogue`) | Toujours frais | Pas de cache, plus lent pour SEO | Faible |

**Recommandation** : **Option A** — les 7 playlists sont stables (ne changent pas de slug, ne se créent/suppriment pas via admin pendant la prod). Génération statique au build + `revalidate: 3600` (1h) pour rafraîchir nameFr/En, descriptions, tracks après curation Emil.

```typescript
// page détail
export const dynamicParams = false; // 404 sur slug inconnu (sécurité)
export const revalidate = 3600;

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const slugs = Object.keys(BOUTIQUE_SLUG_MAP[params.locale as "fr" | "en"]);
  return slugs.map((slug) => ({ slug }));
}
```

Note : si Emil veut "voir immédiatement" une modif, il peut trigger un `revalidatePath('/fr/musique-ambiance')` depuis l'admin (post v1).

---

### Décision 3 : API publique vs query directe

**Contexte** : la page hub a besoin des 7 playlists, la page détail a besoin d'1 playlist + ses tracks.

**Options considérées** :

| Option | Avantages | Inconvénients | Effort |
|---|---|---|---|
| A. Query Drizzle directe dans Server Component | Plus rapide (pas de fetch HTTP interne), pas de duplication | Moins testable isolément | Faible |
| B. Endpoint `/api/playlists/boutique` REST | Réutilisable côté client si besoin | Overhead HTTP, JSON parse | Moyen |

**Recommandation** : **Option A** — pattern App Router idiomatique. Centraliser les queries dans `src/lib/playlists/queries.ts` pour testabilité et réutilisation entre hub/détail.

```typescript
// src/lib/playlists/queries.ts
export async function getBoutiquePlaylists(locale: "fr" | "en") {
  return db.select(...).from(playlists)
    .where(and(
      eq(playlists.audience, "boutique"),
      eq(playlists.isPublished, true)
    ))
    .orderBy(playlists.displayOrder);
}

export async function getBoutiquePlaylistBySlug(slug: string) {
  // Returns playlist + tracks (with isDemo) + count
}
```

---

### Décision 4 : Mécanique coupure 30s côté player

**Contexte** : on ne re-encode pas les fichiers (décidé en PRD). Le timer JS doit couper quand `currentTime >= 30s` ET track non-demo ET utilisateur non-boutique.

**Options considérées** :

| Option | Avantages | Inconvénients | Effort |
|---|---|---|---|
| A. Listener `timeupdate` sur `<audio>` HTML existant + appel `audio.pause()` | Réutilise l'élément audio existant, pattern standard, précision ~250ms (suffisant) | Modifier les composants player | Faible |
| B. `setTimeout(30000)` au play + clear sur pause/seek | Plus simple à coder | Drift si user pause/reprend, pas robuste sur seek | Faible |
| C. Web Audio API (AudioContext) avec scheduling précis | Précision sub-ms | Surdimensionné, refonte player | Élevé |

**Recommandation** : **Option A** — le `timeupdate` event firre toutes les ~250ms, suffit largement pour la précision ±0.5s requise par l'AC. Robuste face aux seeks (user qui scrub avant/après 30s).

**Implémentation** :
```typescript
// Dans le composant qui contient <audio> (PlayerDesktop ou hook partagé)
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;
  const onTimeUpdate = () => {
    const { previewLimitSec, hasBoutiqueAccess, currentTrack } = usePlayerStore.getState();
    if (!previewLimitSec || hasBoutiqueAccess || currentTrack?.isDemo) return;
    if (audio.currentTime >= previewLimitSec) {
      audio.pause();
      usePlayerStore.getState().setIsPreviewEnded(true);
    }
  };
  audio.addEventListener("timeupdate", onTimeUpdate);
  return () => audio.removeEventListener("timeupdate", onTimeUpdate);
}, []);
```

Le store doit gagner :
- `previewLimitSec: number | null` (posé par la page playlist boutique au mount, null ailleurs)
- `hasBoutiqueAccess: boolean` (calculé serveur, init via prop)
- `isPreviewEnded: boolean` (UI flag)
- Et le type `PlayerTrack` doit inclure `isDemo?: boolean`

---

### Décision 5 : Comment passer `hasBoutiqueAccess` du serveur au client

**Contexte** : le store Zustand est client. La page sait si l'user a un abo boutique côté serveur.

**Options considérées** :

| Option | Avantages | Inconvénients | Effort |
|---|---|---|---|
| A. Composant client `<PlayerContextInit>` qui reçoit les props et appelle `setHasBoutiqueAccess` au mount | Pattern actuel du repo (catalogue page passe isSubscribed/canDownload via TrackCard props), peu invasif | Effets de bord au mount | Faible |
| B. React Context dédié `BoutiqueAccessProvider` | Plus pur React | Refonte gating actuel | Moyen |
| C. Cookie httpOnly lu par middleware | Pas de prop drilling | Complexité auth, cache invalidation difficile | Élevé |

**Recommandation** : **Option A** — cohérent avec le pattern existant catalogue.

```typescript
// src/components/boutique/PlayerContextInit.tsx
"use client";
import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";

export default function PlayerContextInit({ hasBoutiqueAccess }: { hasBoutiqueAccess: boolean }) {
  const setHasBoutiqueAccess = usePlayerStore((s) => s.setHasBoutiqueAccess);
  const setPreviewLimitSec = usePlayerStore((s) => s.setPreviewLimitSec);
  const setActivePlaylistAudience = usePlayerStore((s) => s.setActivePlaylistAudience);

  useEffect(() => {
    setHasBoutiqueAccess(hasBoutiqueAccess);
    setPreviewLimitSec(hasBoutiqueAccess ? null : 30);
    setActivePlaylistAudience("boutique");
    return () => {
      // Reset au unmount (user quitte la section)
      setPreviewLimitSec(null);
      setActivePlaylistAudience(null);
    };
  }, [hasBoutiqueAccess, setHasBoutiqueAccess, setPreviewLimitSec, setActivePlaylistAudience]);

  return null;
}
```

---

### Décision 6 : Marquage `is_demo` API admin

**Contexte** : l'admin doit pouvoir cocher "morceau démo" sur 1 track, qui décoche les autres.

**Options considérées** :

| Option | Avantages | Inconvénients | Effort |
|---|---|---|---|
| A. Nouvelle route `PATCH /api/admin/playlists/[id]/tracks/[trackId]` body `{ isDemo: boolean }` qui set + reset les autres dans une transaction | REST idiomatique, atomique grâce à transaction | Nouveau fichier | Faible |
| B. Étendre `PATCH /api/admin/playlists/[id]` avec body `{ tracksUpdate: [{ trackId, isDemo }] }` | Pas de nouvelle route | Endpoint surchargé, mélange responsabilités | Moyen |

**Recommandation** : **Option A** — propre et atomique.

```typescript
// PATCH /api/admin/playlists/[id]/tracks/[trackId]
// body: { isDemo: true }
await db.transaction(async (tx) => {
  if (isDemo) {
    // Reset tous les autres
    await tx.update(playlistTracks)
      .set({ isDemo: false })
      .where(and(
        eq(playlistTracks.playlistId, id),
        ne(playlistTracks.trackId, trackId)
      ));
  }
  await tx.update(playlistTracks)
    .set({ isDemo })
    .where(and(
      eq(playlistTracks.playlistId, id),
      eq(playlistTracks.trackId, trackId)
    ));
});
```

L'index unique partiel DB est une **deuxième barrière** si l'admin a une race condition.

---

### Décision 7 : Migration Drizzle (enum + index partiel)

**Contexte** : ajouter `audience` enum sur `playlists` + `is_demo` boolean sur `playlist_tracks` + unique partial index Postgres.

**Options considérées** :

| Option | Avantages | Inconvénients | Effort |
|---|---|---|---|
| A. `drizzle-kit generate` + édition manuelle du SQL pour le partial index | Drizzle gère 90%, reste 10% en SQL brut | Mix généré + manuel | Faible |
| B. Tout en SQL brut dans une nouvelle migration | Contrôle total | Pas de sync avec schema TS, à éviter | Faible |
| C. Drizzle ORM uniquement avec `uniqueIndex(...).where(...)` | 100% type-safe | Vérifier que Drizzle 0.45 supporte `where` sur index | Faible |

**Recommandation** : **Option C** d'abord (essayer la syntaxe Drizzle), fallback **Option A** si non-supporté.

```typescript
// src/db/schema/playlists.ts (modif)
export const playlistAudienceEnum = pgEnum("playlist_audience", ["creator", "boutique"]);

export const playlists = pgTable("playlists", {
  // ... existant
  audience: playlistAudienceEnum("audience").notNull().default("creator"),
});

export const playlistTracks = pgTable("playlist_tracks", {
  // ... existant
  isDemo: boolean("is_demo").notNull().default(false),
}, (t) => ({
  pk: primaryKey({ columns: [t.playlistId, t.trackId] }),
  // Partial unique index — 1 demo max par playlist
  oneDemo: uniqueIndex("playlist_tracks_one_demo_per_playlist")
    .on(t.playlistId)
    .where(sql`${t.isDemo} = true`),
}));
```

Si la syntaxe `.where()` n'est pas supportée, on appliquera l'index manuellement après `drizzle-kit generate` :

```sql
CREATE UNIQUE INDEX playlist_tracks_one_demo_per_playlist
ON playlist_tracks (playlist_id)
WHERE is_demo = true;
```

---

### Décision 8 : Seed des 7 playlists boutique

**Contexte** : la migration doit créer 7 rows en DB, idempotent (re-run safe).

**Options considérées** :

| Option | Avantages | Inconvénients | Effort |
|---|---|---|---|
| A. SQL `INSERT ... ON CONFLICT (slug) DO NOTHING` dans la migration | Idempotent, pas de script externe | Hardcodé dans migration | Faible |
| B. Script TS séparé `scripts/seed-boutique-playlists.ts` lancé manuellement | Modifiable post-deploy | Étape manuelle | Faible |

**Recommandation** : **Option A** — atomique avec la migration de schéma, garantit que prod ne se déploie pas avec les colonnes mais sans les 7 playlists.

---

## Impact sur l'Existant

### Fichiers à modifier

| Fichier | Type de modification | Risque |
|---|---|---|
| `src/db/schema/playlists.ts` | Ajout enum + colonne + index | Bas (additif) |
| `src/db/schema/index.ts` | Export nouveau enum | Bas |
| `src/i18n/routing.ts` | Ajout `pathnames` config | **Moyen** — affecte routing global |
| `messages/fr.json` + `messages/en.json` | Ajout clés (additif) | Bas |
| `src/components/layout/Header.tsx` | +1 entrée nav | Bas |
| `src/components/layout/MobileMenu.tsx` | +1 entrée nav | Bas |
| `src/store/playerStore.ts` | +4 fields, +4 actions | Bas (additif, pas de breaking change) |
| `src/components/player/PlayerDesktop.tsx` | Hook timer 30s | **Moyen** — composant critique |
| `src/components/player/PlayerMobileMini.tsx` | Hook timer 30s | **Moyen** — composant critique |
| `src/components/admin/PlaylistEditor.tsx` | UI audience + checkbox demo | Bas |
| `src/app/api/admin/playlists/[id]/route.ts` | PATCH accepte `audience` | Bas |
| `src/app/api/playlists/route.ts` | Retourne `audience` + `isDemo` (rétrocompat) | Bas |

### Dépendances impactées

- **next-intl** : passage de routing simple à pathnames typés. Toutes les `<Link>` du repo continuent à fonctionner avec `localePrefix: "always"`, mais les futurs liens vers la nouvelle section devront utiliser le `Link` de next-intl pour bénéficier du mapping (à valider en testing).
- **Espace membre** (`/[locale]/membre/page.tsx`) : utilise `/api/playlists` qui va maintenant retourner aussi des playlists `audience=boutique`. À filtrer côté membre ou à laisser passer (les playlists boutique restent visibles pour les abonnés boutique connectés). À trancher : par défaut, **on ne filtre pas** — le membre voit toutes les playlists publiées dont il a accès.

### Risques de régression

| Risque | Mitigation |
|---|---|
| Breaking change next-intl pathnames sur routes existantes | Migrer pathnames en un seul commit, tester toutes les routes du menu (catalogue, blog, etc.) |
| Coupure 30s s'applique aux pages catalogue (où elle ne devrait pas) | `previewLimitSec` reste `null` partout sauf section musique-ambiance via `PlayerContextInit`. Le store reset au unmount. |
| Migration playlists.ts manquante en prod (drizzle-kit push) | Vérifier l'état prod avant deploy, consolider migration si nécessaire |
| Index unique partiel échoue sur des données existantes (si plusieurs `is_demo=true` créés avant l'index) | Données vierges au déploiement, pas de risque. Migration tourne avant que l'admin puisse cocher quoi que ce soit. |

### Tests à prévoir

- **Manuel critique** :
  - Toutes les routes existantes (catalogue, blog, abonnements, etc.) résolvent correctement après l'ajout des `pathnames` next-intl
  - Player audio sur `/fr/catalogue` (pas de coupure 30s)
  - Player audio sur `/fr/musique-ambiance/salon-coiffure` (coupure à 30s pour non-abonné, full pour démo, full pour abonné boutique)
- **E2E (Playwright déjà installé)** :
  - Naviguer vers la page hub → vérifier 7 cartes
  - Cliquer une carte → vérifier page détail charge
  - Player démarre, attendre 30s, vérifier pause + toast
  - Admin : créer une playlist test, marquer audience=boutique, marquer 1 track demo, vérifier les autres se décochent
- **Type-check + lint** sur tout le projet après modifs
- **DB migration** : run en local sur DB de test, vérifier rollback safe

---

## Plan d'Implémentation

> Découpé en 9 epics avec stories et tasks. Cocher au fil de l'implémentation.

### Epic 1 : Fondations DB

#### Story 1.1 : Schéma Drizzle étendu
**Objectif** : Ajouter `audience` enum sur `playlists`, `is_demo` boolean sur `playlist_tracks`, et index unique partiel.

**Tasks** :
- [x] 1.1.1 Ajouter `pgEnum("playlist_audience", ["creator", "boutique"])` dans `src/db/schema/playlists.ts` et l'exporter
- [x] 1.1.2 Ajouter colonne `audience: playlistAudienceEnum("audience").notNull().default("creator")` sur la table `playlists`
- [x] 1.1.3 Ajouter colonne `isDemo: boolean("is_demo").notNull().default(false)` sur la table `playlist_tracks`
- [x] 1.1.4 Ajouter `uniqueIndex("playlist_tracks_one_demo_per_playlist").on(t.playlistId).where(sql`${t.isDemo} = true`)` (fallback : SQL brut si non-supporté) — Drizzle ORM API a fonctionné, pas de SQL brut nécessaire
- [x] 1.1.5 Vérifier que le fichier `src/db/schema/index.ts` ré-exporte bien le nouveau enum — déjà exporté via `export * from "./playlists"`
- [x] 1.1.6 Lancer `npx drizzle-kit generate` pour produire le SQL, inspecter le fichier généré dans `src/db/migrations/` — fichier `0004_add_playlist_audience_and_demo.sql` créé
- [x] 1.1.7 Si l'index partiel n'est pas dans le SQL généré, l'ajouter manuellement à la fin du fichier de migration — l'index est bien généré par Drizzle, no-op
- **Note imprévue** : la migration générée inclut aussi `CREATE TABLE newsletter_subscribers` (table ajoutée au schéma sans migration antérieure, probablement créée via `drizzle-kit push`). Wrappée en `CREATE TABLE IF NOT EXISTS` pour rester idempotent.

**Estimation** : S
**Dépendances** : aucune

#### Story 1.2 : Seed des 7 playlists boutique
**Objectif** : Insérer en DB les 7 playlists vides avec metadata FR+EN, dans la même migration que le schéma.

**Tasks** :
- [x] 1.2.1 Rédiger le bloc SQL `INSERT INTO playlists (slug, name_fr, name_en, description_fr, description_en, gradient, emoji, audience, is_published, display_order) VALUES (...)` × 7
- [x] 1.2.2 Ajouter `ON CONFLICT (slug) DO NOTHING` pour idempotence
- [x] 1.2.3 Choisir 7 emojis distincts — 💇 💅 🧘 🐾 🦷 🤲 🧠
- [x] 1.2.4 Choisir 7 gradients distincts — couleurs métier-spécifiques (orange chaud / rose-violet / turquoise / vert nature / bleu clair / violet doux / gris neutre)
- [x] 1.2.5 Rédiger les 7 descriptions courtes FR (40-80 mots, mot-clé SEO en première phrase)
- [x] 1.2.6 Rédiger les 7 descriptions courtes EN (mêmes contraintes)
- [x] 1.2.7 Appliquer la migration en local — fait via node + postgres lib (drizzle-kit push tentait un truncate, voir notes Story 1.1). DB validée : audience/is_demo colonnes + index partiel + 7 playlists boutique (display_order 1-7) en plus des 8 playlists creator existantes.
- [x] 1.2.8 Slugs DB canoniques (FR) confirmés : `salon-coiffure`, `institut-beaute`, `spa-massage`, `cabinet-veterinaire`, `cabinet-dentaire`, `osteopathe-kine`, `cabinet-psychologue`. Le mapping vers slugs EN sera fait dans Story 3.2.

**Estimation** : M
**Dépendances** : 1.1

---

### Epic 2 : Helpers serveur (queries + access)

#### Story 2.1 : Query helpers playlists boutique
**Objectif** : Centraliser les queries Drizzle utilisées par les pages publiques.

**Tasks** :
- [x] 2.1.1 Créer `src/lib/playlists/queries.ts`
- [x] 2.1.2 Implémenter `getBoutiquePlaylists()` retournant les 7 playlists (avec `trackCount` calculé via `COUNT(pt.track_id)::int` + GROUP BY, plus efficace que charger toutes les tracks)
- [x] 2.1.3 Implémenter `getBoutiquePlaylistBySlug(slug)` retournant playlist + tracks (avec `isDemo` flag) joinés sur `tracks` table + `artists`
- [x] 2.1.4 Trier les tracks par `position` ASC
- [x] 2.1.5 Inclure `previewPath` (URL publique Supabase Storage) dans le retour pour pouvoir jouer l'audio

**Estimation** : S
**Dépendances** : 1.1, 1.2

#### Story 2.2 : Helper user access
**Objectif** : Centraliser la détection d'accès boutique pour SSR.

**Tasks** :
- [x] 2.2.1 Créer `src/lib/subscriptions/access.ts`
- [x] 2.2.2 Implémenter `getUserAccess(userId: string | null)` retournant `{ isSubscribed, hasCreatorAccess, hasBoutiqueAccess }`
- [x] 2.2.3 Si `userId` null, retourner `{ false, false, false }` (constante `NO_ACCESS`)
- [x] 2.2.4 Sinon query `subscriptions` table avec `status='active'`, calculer flags depuis `planType` (gère le cas user avec plusieurs abos actifs)
- [x] 2.2.5 Refactoriser `src/app/[locale]/catalogue/page.tsx` pour utiliser ce helper — imports `subscriptions`, `and` retirés, comportement identique

**Estimation** : S
**Dépendances** : aucune

---

### Epic 3 : i18n + routing localisé

#### Story 3.1 : Migration vers next-intl pathnames
**Objectif** : Activer les slugs FR ≠ EN via la config `pathnames` de next-intl v4.

**Tasks** :
- [x] 3.1.1 Confirmé via le type `Pathnames<Locales>` dans `node_modules/next-intl/dist/types/routing/types.d.ts` : `Record<Pathname, Partial<Record<Locale, Pathname>> | Pathname>`. Routes string = même slug FR/EN, object = mapping locale.
- [x] 3.1.2 Pathnames inlines dans `src/i18n/routing.ts` (au lieu d'un fichier séparé `pathnames.ts` — 30 lignes, pas la peine de séparer)
- [x] 3.1.3 `src/i18n/routing.ts` étendu avec `pathnames` exhaustif (22 routes existantes en string + 2 nouvelles en object)
- [x] 3.1.4 `src/i18n/navigation.ts` existait déjà avec `createNavigation(routing)` — pas besoin de le toucher
- [x] 3.1.5 Build prod lancé en background pour valider toutes les routes compilent
- [x] 3.1.6 Pathnames `/musique-ambiance` ↔ `/ambient-music` ajoutés
- [x] 3.1.7 Pathnames `/musique-ambiance/[slug]` ↔ `/ambient-music/[slug]` ajoutés
- **Note imprévue** : l'activation de `pathnames` impose que TOUTES les routes utilisées via les helpers typés (`Link`, `useRouter`, `usePathname`) soient listées. Sinon erreur TS. → 22 routes existantes listées en string. Aussi, `LanguageSwitcher.tsx` a dû être patché pour passer `{pathname, params}` à `router.replace` au lieu de `pathname` seul (combo avec `useParams()` de next/navigation).

**Estimation** : M
**Dépendances** : aucune
**Risque** : peut casser le routing si mal fait — tester chaque route du menu après modif

#### Story 3.2 : Mapping des 7 slugs FR↔EN
**Objectif** : Mapper le slug URL localisé vers le slug DB canonique.

**Tasks** :
- [x] 3.2.1 Créer `src/lib/boutique/slug-mapping.ts` avec un objet `BOUTIQUE_SLUG_MAP` (FR/EN → slug DB)
- [x] 3.2.2 Définir les 7 slugs EN (PRD §4.5 validés) :
  - `salon-coiffure` → `hair-salon`
  - `institut-beaute` → `beauty-salon`
  - `spa-massage` → `spa-massage`
  - `cabinet-veterinaire` → `veterinary-clinic`
  - `cabinet-dentaire` → `dental-clinic`
  - `osteopathe-kine` → `osteopath-physio`
  - `cabinet-psychologue` → `therapist-office`
- [x] 3.2.3 Helpers exportés : `resolveSlugToDb(localeSlug, locale)`, `resolveDbToSlug(dbSlug, locale)`, `getAllSlugsForLocale(locale)` (bonus utile pour `generateStaticParams`)

**Estimation** : S
**Dépendances** : 3.1

#### Story 3.3 : Clés de traduction
**Objectif** : Toutes les chaînes statiques sont dans `messages/{fr,en}.json`.

**Tasks** :
- [x] 3.3.1 Clé `nav.ambient` ajoutée FR ("Musique d'ambiance") + EN ("Ambient Music")
- [x] 3.3.2 Section `boutique.hub.*` ajoutée : `title`, `intro` (50-80 mots SEO), `cta`, `emptyState`
- [x] 3.3.3 Section `boutique.playlist.*` ajoutée : `backToHub`, `demoBadge`, `demoBadgeFull`, `previewEnded`, `previewEndedCta`, `ctaPrimary`, `ctaSecondary`, `relatedTitle`, `trackCount`, `trackCountSingular`, `trackCountEmpty`, `playAriaLabel`
- [x] 3.3.4 Section `boutique.popup.*` ajoutée : `title`, `subtitle`, `planName`, `planPrice` (99,99 € / €99.99), `planPeriod` (/an / /year), `planBadge`, `feature1`-`feature5`, `ctaSubscribe`, `closeAriaLabel`
- [x] 3.3.5 Validation : à vérifier au fil du dev des composants Epic 5 (aucune chaîne en dur dans `BoutiquePlaylistCard`, `BoutiqueTrackList`, etc.)

**Estimation** : S
**Dépendances** : aucune

---

### Epic 4 : Pages publiques

#### Story 4.1 : Page hub `/[locale]/musique-ambiance`
**Objectif** : Page SSG listant les 7 playlists boutique avec intro SEO.

**Tasks** :
- [ ] 4.1.1 Créer `src/app/[locale]/musique-ambiance/page.tsx` (server component)
- [ ] 4.1.2 Définir `export const revalidate = 3600`
- [ ] 4.1.3 Implémenter `generateMetadata` : title, description, canonical (depuis traductions)
- [ ] 4.1.4 Query via `getBoutiquePlaylists()` + `getUserAccess()`
- [ ] 4.1.5 Render header H1, paragraphe intro SEO (50-80 mots, mot-clé "musique d'ambiance professionnelle libre de droits")
- [ ] 4.1.6 Render grid responsive (3 colonnes desktop, 2 tablette, 1 mobile) de `<BoutiquePlaylistCard>`
- [ ] 4.1.7 Render bloc CTA "Voir l'abonnement Boutique" pointant vers `/[locale]/abonnements#boutique`
- [ ] 4.1.8 Render `<BoutiqueSubscriptionPopup hasBoutiqueAccess={...} />` (conditionnel : pas affiché si déjà abonné boutique)
- [ ] 4.1.9 Inclure schema.org JSON-LD `CollectionPage` listant les 7 playlists

**Estimation** : M
**Dépendances** : 2.1, 2.2, 3.3

#### Story 4.2 : Page détail `/[locale]/musique-ambiance/[slug]`
**Objectif** : Page SSG par playlist avec lecteur intégré et CTAs.

**Tasks** :
- [ ] 4.2.1 Créer `src/app/[locale]/musique-ambiance/[slug]/page.tsx`
- [ ] 4.2.2 Définir `export const dynamicParams = false` + `revalidate = 3600`
- [ ] 4.2.3 Implémenter `generateStaticParams` retournant les 7 slugs locaux
- [ ] 4.2.4 Implémenter `generateMetadata` : title (`{playlistName} | Musique d'ambiance | Lalason`), description spécifique vertical, canonical
- [ ] 4.2.5 Résoudre `params.slug` (slug local) → slug DB via `resolveSlugToDb`
- [ ] 4.2.6 Query `getBoutiquePlaylistBySlug(dbSlug)` + `getUserAccess()`. 404 si playlist non trouvée ou non publiée
- [ ] 4.2.7 Render header avec gradient, emoji, H1, description longue
- [ ] 4.2.8 Render CTA primaire en haut "S'abonner à la formule Boutique"
- [ ] 4.2.9 Render `<BoutiqueTrackList tracks={playlist.tracks} />` (avec badge demo)
- [ ] 4.2.10 Si `playlist.tracks.length === 0` → render `<EmptyPlaylistState />` au lieu de la liste
- [ ] 4.2.11 Render CTA secondaire en bas "S'abonner à la formule Boutique"
- [ ] 4.2.12 Render bloc "Autres playlists boutique" (3 cartes max, exclure la playlist courante)
- [ ] 4.2.13 Render `<PlayerContextInit hasBoutiqueAccess={...} />`
- [ ] 4.2.14 Render `<BoutiqueSubscriptionPopup hasBoutiqueAccess={...} />`
- [ ] 4.2.15 Inclure schema.org JSON-LD `MusicPlaylist` (avec list de `MusicRecording`)

**Estimation** : L
**Dépendances** : 2.1, 2.2, 3.2, 3.3, 5.x (composants UI), 6.x (player), 7.x (popup)

---

### Epic 5 : Composants UI boutique

#### Story 5.1 : `BoutiquePlaylistCard`
**Objectif** : Carte affichée sur le hub.

**Tasks** :
- [ ] 5.1.1 Créer `src/components/boutique/BoutiquePlaylistCard.tsx` (client si interactivité, sinon server)
- [ ] 5.1.2 Render gradient (background) + emoji (en grand) + nameFr/nameEn (h2 ou h3) + description courte + count "X morceaux"
- [ ] 5.1.3 Wrap dans `<Link href={`/musique-ambiance/${slug}`}>` (utiliser le `Link` de next-intl)
- [ ] 5.1.4 Hover : leger scale + shadow (cohérent design existant catalogue)
- [ ] 5.1.5 Mobile-first : full-width sur < 640px

#### Story 5.2 : `BoutiqueTrackList`
**Objectif** : Liste de morceaux d'une playlist avec badge demo et bouton play.

**Tasks** :
- [ ] 5.2.1 Créer `src/components/boutique/BoutiqueTrackList.tsx` (client component, doit interagir avec le store)
- [ ] 5.2.2 Render chaque track : numéro, titre, artiste, durée formatée (mm:ss), bouton play, badge "Démo" si `isDemo`
- [ ] 5.2.3 Au clic play, appeler `usePlayerStore().playTrack(track, allTracks, index)` avec `track.isDemo` propagé
- [ ] 5.2.4 Indicateur visuel sur la track en cours (si `currentTrack.id === track.id` → highlight)
- [ ] 5.2.5 `aria-label` explicite sur le bouton play : `Écouter ${title} de ${artist}` (i18n)
- [ ] 5.2.6 Navigation clavier : tab + Enter pour jouer

#### Story 5.3 : `EmptyPlaylistState`
**Objectif** : État quand la playlist n'a pas encore de morceaux.

**Tasks** :
- [ ] 5.3.1 Créer `src/components/boutique/EmptyPlaylistState.tsx`
- [ ] 5.3.2 Message FR/EN ("Playlist en cours de curation, revenez bientôt")
- [ ] 5.3.3 Lien vers le hub pour voir les autres playlists
- [ ] 5.3.4 Visual : icône placeholder, padding généreux, ton accueillant

#### Story 5.4 : `PreviewEndedToast`
**Objectif** : Notification persistante affichée à la coupure 30s.

**Tasks** :
- [ ] 5.4.1 Créer `src/components/boutique/PreviewEndedToast.tsx`
- [ ] 5.4.2 Lire `isPreviewEnded` depuis le store
- [ ] 5.4.3 Afficher toast en bas (au-dessus du player), positionné fixed, animation slide-up
- [ ] 5.4.4 Texte : "Extrait limité à 30 secondes — abonnez-vous pour écouter en illimité"
- [ ] 5.4.5 Bouton CTA vers `/[locale]/abonnements#boutique`
- [ ] 5.4.6 Bouton fermeture (croix)
- [ ] 5.4.7 `aria-live="polite"` pour annonce screen reader
- [ ] 5.4.8 Auto-clear `isPreviewEnded` quand le user lance un autre morceau

**Estimation Epic 5** : M
**Dépendances** : 6.1 (store extensions), 3.3

---

### Epic 6 : Lecteur audio + mécanique 30s

#### Story 6.1 : Extension du `playerStore`
**Objectif** : Ajouter les flags pour gérer la limite preview.

**Tasks** :
- [x] 6.1.1 Interface `PlayerState` étendue : `previewLimitSec`, `isPreviewEnded`, `hasBoutiqueAccess`, `activePlaylistAudience`
- [x] 6.1.2 `PlayerActions` étendu : `setPreviewLimitSec`, `setIsPreviewEnded`, `setHasBoutiqueAccess`, `setActivePlaylistAudience`
- [x] 6.1.3 Valeurs par défaut initialisées (null, false, false, null)
- [x] 6.1.4 `PlayerTrack` étendu avec `isDemo?: boolean` (optional, default implicite false)
- [x] 6.1.5 `playTrack` reset `isPreviewEnded: false` à chaque nouveau play
- [x] 6.1.6 `togglePlay`/`stop`/`seek` ne touchent pas `isPreviewEnded` (toast persistant après pause). Pas de reset systématique dans `next()`/`prev()` car en mode boutique l'auto-chaînage est désactivé (Story 6.2.6)

#### Story 6.2 : Hook timer dans le lecteur
**Objectif** : Couper l'audio à 30s si conditions remplies.

**Tasks** :
- [x] 6.2.1 L'élément `<audio>` HTML est centralisé dans `PlayerProvider.tsx` (créé via `new Audio()` dans `useEffect` une seule fois, partagé entre PlayerDesktop et PlayerMobileMini)
- [x] 6.2.2 Le listener `timeupdate` existait déjà (pour `setProgress`) — j'y ai ajouté la logique de coupure
- [x] 6.2.3 Logique de coupure ajoutée avec lecture du store via `usePlayerStore.getState()` (évite re-attachement du listener à chaque change)
- [x] 6.2.4 Cleanup déjà géré (le `removeEventListener` existant nettoie aussi notre logique additionnée)
- [x] 6.2.5 Modif faite au SEUL endroit centralisé (PlayerProvider) — pas de duplication entre PlayerDesktop/PlayerMobileMini
- [x] 6.2.6 Auto-chaînage désactivé en mode boutique : event `ended` check `activePlaylistAudience === "boutique"` → `setIsPlaying(false)` au lieu d'appeler `next()`

#### Story 6.3 : `PlayerContextInit`
**Objectif** : Composant client qui pose les flags du store au mount des pages boutique.

**Tasks** :
- [x] 6.3.1 `src/components/boutique/PlayerContextInit.tsx` créé
- [x] 6.3.2 Reçoit `hasBoutiqueAccess: boolean` en prop (calculé serveur, jamais fetched client)
- [x] 6.3.3 Au mount : pose les 3 flags du store
- [x] 6.3.4 Au unmount : reset (sauf `hasBoutiqueAccess` qui reflète le user actuel — pas un flag de contexte)
- [x] 6.3.5 Render `null` (composant headless)

**Estimation Epic 6** : L
**Dépendances** : Story 5.4 (toast)

---

### Epic 7 : Popup d'incitation

#### Story 7.1 : `BoutiqueSubscriptionPopup`
**Objectif** : Popup 15s avec 1 carte plan boutique.

**Tasks** :
- [ ] 7.1.1 Créer `src/components/boutique/BoutiqueSubscriptionPopup.tsx`
- [ ] 7.1.2 Forker la structure de `src/components/catalogue/SubscriptionPopup.tsx`
- [ ] 7.1.3 Recevoir prop `hasBoutiqueAccess: boolean` + `locale`
- [ ] 7.1.4 Si `hasBoutiqueAccess`, return `null` (pas afficher pour clients existants)
- [ ] 7.1.5 Au mount : check `sessionStorage.getItem("boutique-popup-dismissed")` — si `"1"`, ne pas montrer
- [ ] 7.1.6 Sinon `setTimeout(15000)` puis `setVisible(true)` ET poser `sessionStorage.setItem("boutique-popup-dismissed", "1")` pour ne pas réapparaître au navigation suivant
- [ ] 7.1.7 Render 1 carte (pas 2 comme catalogue) : prix 99,99 €/an, badge "Sans engagement", bouton "S'abonner"
- [ ] 7.1.8 Render 3-5 bénéfices avec icônes Check (réutiliser composant existant)
- [ ] 7.1.9 Backdrop blur + fadeIn animation, modal slideUp animation
- [ ] 7.1.10 Bouton fermeture (croix) + clic backdrop pour fermer
- [ ] 7.1.11 `aria-modal="true"`, focus trap basique, Escape pour fermer
- [ ] 7.1.12 Clé `sessionStorage` distincte : `boutique-popup-dismissed` (NE PAS réutiliser `sub-popup-dismissed`)

**Estimation** : M
**Dépendances** : 3.3 (traductions)

---

### Epic 8 : Admin extensions

#### Story 8.1 : Sélecteur Audience dans PlaylistEditor
**Objectif** : Permettre de marquer une playlist comme `creator` ou `boutique`.

**Tasks** :
- [ ] 8.1.1 Modifier `src/components/admin/PlaylistEditor.tsx` : ajouter un `<select>` ou radio group "Audience" avec les options
- [ ] 8.1.2 Bind sur le state local de la playlist
- [ ] 8.1.3 Modifier la mutation `saveMetadata()` pour inclure `audience` dans le body PATCH
- [ ] 8.1.4 Modifier `src/app/api/admin/playlists/[id]/route.ts` PATCH pour accepter et appliquer `audience`
- [ ] 8.1.5 Vérifier que la valeur DB est bien dans l'enum (zod ou check manuel)

#### Story 8.2 : Checkbox "Morceau démo" + endpoint
**Objectif** : Marquer 1 track comme démo dans une playlist.

**Tasks** :
- [ ] 8.2.1 Créer `src/app/api/admin/playlists/[id]/tracks/[trackId]/route.ts` avec method PATCH
- [ ] 8.2.2 Auth admin via `checkAdmin()` (helper existant)
- [ ] 8.2.3 Body validation : `{ isDemo: boolean }` (zod ou manuel)
- [ ] 8.2.4 Implémenter la transaction : si `isDemo=true` → reset les autres tracks de la playlist à `isDemo=false`, puis set le track ciblé
- [ ] 8.2.5 Modifier `PlaylistEditor.tsx` : ajouter une checkbox "Démo" sur chaque track de la liste
- [ ] 8.2.6 Au toggle, appeler le nouveau endpoint, refresh la liste locale
- [ ] 8.2.7 Indicateur visuel : track démo a un badge ou highlight différent

#### Story 8.3 : Avertissement playlist boutique sans démo
**Objectif** : Aider l'admin à comprendre l'impact.

**Tasks** :
- [ ] 8.3.1 Dans `PlaylistEditor.tsx`, si `audience === "boutique"` ET aucun track avec `isDemo === true` → afficher un bandeau d'avertissement (couleur warning du brand kit)
- [ ] 8.3.2 Texte : "Cette playlist boutique n'a pas de morceau démo. Les visiteurs n'entendront que des extraits de 30s — choisissez un morceau représentatif à mettre en démo full."

**Estimation Epic 8** : M
**Dépendances** : 1.1, 2.1

---

### Epic 9 : Navigation menu

#### Story 9.1 : Ajout entrée dans Header + MobileMenu
**Objectif** : "Musique d'ambiance" visible dans le menu.

**Tasks** :
- [ ] 9.1.1 Modifier `src/components/layout/Header.tsx` `navLinks` array : insérer `{ href: ..., label: t("ambient") }` en position 2 (après catalogue)
- [ ] 9.1.2 Utiliser le `Link` de next-intl si nécessaire (avec pathnames) — `href: "/musique-ambiance"` qui sera mappé selon locale
- [ ] 9.1.3 Modifier `src/components/layout/MobileMenu.tsx` similairement
- [ ] 9.1.4 Vérifier ordre identique sur les deux composants
- [ ] 9.1.5 Vérifier responsive : pas de débordement / wrap moche en moyennes largeurs

**Estimation** : S
**Dépendances** : 3.1, 3.3

---

### Epic 10 : QA / validation

#### Story 10.1 : Vérification AC binaires
**Objectif** : Cocher tous les AC de la PRD §8.

**Tasks** :
- [ ] 10.1.1 Lancer le serveur dev local, parcourir tous les AC navigation et menu
- [ ] 10.1.2 Vérifier toutes les routes (FR + EN, hub + 7 détails) → 200
- [ ] 10.1.3 Vérifier h1 unique + meta title/description sur chaque page (Inspect HTML)
- [ ] 10.1.4 Vérifier presence schema.org JSON-LD valide (Google Rich Results Test)
- [ ] 10.1.5 Vérifier coupure 30s pile (chronométrer ±0.5s) sur 2-3 morceaux
- [ ] 10.1.6 Vérifier le morceau démo joue en intégralité
- [ ] 10.1.7 Vérifier abonné boutique (créer un compte test) joue en intégralité
- [ ] 10.1.8 Vérifier popup à 15s exactement, fermeture, sessionStorage
- [ ] 10.1.9 Vérifier admin : audience selector, checkbox demo, warning visuel

#### Story 10.2 : Responsive + Accessibilité
**Tasks** :
- [ ] 10.2.1 Tester mobile (360px, 414px, 768px) sur hub + détail + popup → pas de scroll horizontal
- [ ] 10.2.2 Tester navigation clavier sur la liste de tracks (tab + Enter pour jouer)
- [ ] 10.2.3 Vérifier `aria-label` boutons play, `aria-live` toast, `aria-modal` popup
- [ ] 10.2.4 Vérifier contraste WCAG AA sur les cartes à gradient (outil : Lighthouse ou axe DevTools)

#### Story 10.3 : Non-régression
**Tasks** :
- [ ] 10.3.1 Naviguer sur toutes les routes existantes (catalogue, blog, abonnements, nos-artistes, mentions-legales, etc.) en FR et EN — vérifier 200
- [ ] 10.3.2 Tester le player audio sur `/fr/catalogue` (PAS de coupure 30s)
- [ ] 10.3.3 Tester l'admin pour les playlists existantes (rétrocompatibilité — toutes doivent avoir `audience='creator'` par défaut)
- [ ] 10.3.4 Run `npx tsc --noEmit` (zéro erreur de type)
- [ ] 10.3.5 Run `npm run lint` (zéro nouvelle warning)
- [ ] 10.3.6 Build prod local (`npm run build`) → succès

**Estimation Epic 10** : M
**Dépendances** : toutes les autres

---

## Suivi d'Avancement

> Section consolidée pour tracking via `/task` et `/status`. Cocher les tasks ci-dessus au fil de l'implémentation.

**Progression globale** : 0/80 tasks

| Epic | Tasks complétées / total |
|---|---|
| 1. Fondations DB | 15 / 15 ✓ |
| 2. Helpers serveur | 10 / 10 ✓ |
| 3. i18n + routing | 13 / 13 ✓ |
| 4. Pages publiques | 0 / 24 |
| 5. Composants UI boutique | 0 / 17 |
| 6. Lecteur audio + 30s | 17 / 17 ✓ |
| 7. Popup | 0 / 12 |
| 8. Admin extensions | 0 / 9 |
| 9. Navigation menu | 0 / 5 |
| 10. QA | 0 / 17 |

---

## Décisions à valider (avant build)

- [ ] **D1** Routing localisé : Option A (next-intl pathnames avec slugs FR≠EN) confirmée ?
- [ ] **D2** Cache : SSG + revalidate 3600 sur les pages confirmé ?
- [ ] **D3** API : query Drizzle directe en server component, pas d'endpoint REST public dédié, OK ?
- [ ] **D4** Coupure 30s : timer JS sur `timeupdate` event de `<audio>`, OK ?
- [ ] **D5** Pattern `PlayerContextInit` (composant client headless) au mount/unmount des pages boutique, OK ?
- [ ] **D6** Endpoint admin séparé `PATCH /api/admin/playlists/[id]/tracks/[trackId]` pour `is_demo`, OK ?
- [ ] **D7** Index unique partiel via Drizzle ORM API (fallback SQL brut si non-supporté), OK ?
- [ ] **D8** Seed des 7 playlists dans la migration SQL avec `ON CONFLICT DO NOTHING`, OK ?
- [ ] **D9** Slugs EN proposés OK (PRD §4.5 + plan 3.2) ou Emil veut ajuster ?

## Risques principaux

1. **Migration vers `pathnames` next-intl** — affecte le routing global du site, à tester sur chaque route existante en QA
2. **Modification du lecteur audio** — composant critique utilisé partout (catalogue), risque de régression sur la lecture standard
3. **Schéma `playlists` non-migré actuellement** — vérifier l'état prod avant déploiement de la migration

## Prêt pour le build ?

**Oui, après validation des 9 décisions ci-dessus.** Si Emil valide tout, on attaque par l'**Epic 1** (fondations DB) en premier (bloque tout le reste).

---

## Prochaines étapes

1. **Review** : Emil valide le plan + les 9 décisions techniques.
2. **Build** : utiliser `/task` en référençant ce plan. Commencer par Epic 1 → Epic 2 → puis branches parallèles (3, 6 puis 4, 5, 7).
3. **Update** : à chaque task complétée, cocher `- [ ]` → `- [x]` dans ce fichier. Ajouter une note si l'implémentation a dévié du plan.
4. **Statut final** : passer le statut à "Terminé" quand toutes les tasks sont cochées et la QA validée.
