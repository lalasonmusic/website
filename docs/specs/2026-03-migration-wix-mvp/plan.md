# Plan Technique : Migration Lalason — Wix vers Stack Custom (Phase 1 / MVP)

**Date** : 2026-03
**Statut** : Draft
**Branche** : `main`

---

## Architecture Generale

```
Browser
  │
  ▼
Next.js 15 App Router (Vercel)
  ├── /[locale]/*         → Pages publiques (SSR/SSG/ISR)
  ├── /[locale]/membre/*  → Espace membre (SSR protege)
  ├── /admin/*            → Back-office (SSR protege, role admin)
  └── /api/*              → Routes API (webhooks Stripe, newsletter, etc.)
        │
        ├── Supabase Auth       → Sessions, JWT, Google OAuth
        ├── Supabase DB (PG)    → Tracks, Blog, Users, Subscriptions
        ├── Supabase Storage    → Fichiers audio (full + preview 30s)
        └── Stripe API          → Plans, Checkout, Webhooks, Portal
```

---

## Decisions Techniques

### Decision 1 : State management du player audio

**Contexte** : Le player doit persister pendant toute la navigation (cross-page) sans se couper.

| Option | Avantages | Inconvenients | Effort |
|--------|-----------|---------------|--------|
| React Context | Natif React, pas de dependance | Re-renders sur chaque changement d'etat | Faible |
| Zustand | Leger (1kb), zero re-render inutile, devtools | Dependance supplementaire | Faible |
| Jotai | Atomic, granulaire | Moins connu, courbe d'apprentissage | Moyen |

**Recommandation : Zustand** — Le player a beaucoup d'etats (currentTrack, isPlaying, progress, volume, queue) qui changent souvent. Zustand evite les re-renders en cascade qui causeraient des glitches audio.

---

### Decision 2 : Format de contenu du blog

**Contexte** : Les articles Wix sont en format `richContent` (JSON proprietaire).

| Option | Avantages | Inconvenients | Effort |
|--------|-----------|---------------|--------|
| HTML (converti a la migration) | Standard, rendu simple avec sanitisation | Perte possible de structure fine | Faible |
| Markdown | Portable, readable | Conversion Wix → MD imparfaite | Moyen |
| JSON richContent Wix | Fidelite maximale | Renderer custom necessaire | Eleve |

**Recommandation : HTML** — Converti lors du script de migration avec `sanitize-html`. Simple, eprouve, suffisant pour des articles de blog statiques.

---

### Decision 3 : Strategie de cache

| Page | Strategie | Raison |
|------|-----------|--------|
| Home | ISR (revalidate: 3600) | Contenu stable, SEO critique |
| Catalogue | SSR | Filtres dynamiques dans l'URL |
| Sous-pages /par-style/* | ISR (revalidate: 86400) | Rarement mis a jour, SEO fort |
| Blog listing | ISR (revalidate: 3600) | Nouveaux articles occasionnels |
| Blog article | ISR (revalidate: 86400) | Tres stable une fois publie |
| Artistes | ISR (revalidate: 86400) | Quasi-statique |
| Abonnements | SSR | Prix a jour en temps reel |
| Espace membre | SSR + no-cache | Donnees personnelles, securite |
| Admin | SSR + no-cache | Donnees temps reel |

---

### Decision 4 : Previews audio (extraits 30s)

| Option | Avantages | Inconvenients | Effort |
|--------|-----------|---------------|--------|
| Pre-generer les clips 30s a la migration | Performance maximale, simple a servir | Espace de stockage x2 | Moyen |
| Generer a la volee via API route | Pas de stockage supplementaire | Latence, complexite, charge serveur | Eleve |
| HTTP Range Requests | Zero stockage extra | Expose indirectement le fichier complet | Non recommande |

**Recommandation : Pre-generer** — Avec ffmpeg lors du script de migration, on coupe les 30 premieres secondes. Stockage dans un bucket separe `audio-previews` (public). Simple, performant, securise.

---

### Decision 5 : Schema base de donnees

Structure Drizzle ORM (PostgreSQL / Supabase) :

```
profiles          → Extension de auth.users (role, stripe_customer_id, subscription_status)
tracks            → Catalogue musical (titre, slug, artiste_id, duree, bpm, fichiers audio)
artists           → 7 artistes (nom, bio, photo)
categories        → Tags unifies (type: STYLE | THEME | MOOD, slug, label_fr, label_en)
track_categories  → Junction table tracks ↔ categories (many-to-many)
blog_posts        → 38 articles (titre, slug, contenu_html, categorie, auteur, dates, meta)
subscriptions     → Abonnements Stripe synchronises (stripe_subscription_id, plan, status)
downloads         → Historique des telechargements (user_id, track_id, timestamp)
youtube_channels  → Channel IDs YouTube des abonnes (user_id, channel_id, status)
```

---

## Risques Identifies

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Redirections 301 manquantes | Perte de trafic SEO | Mapping exhaustif des URLs Wix avant go-live |
| Donnees Stripe non synchronisees | Abonnes existants perdent l'acces | Script de seed des subscriptions depuis Stripe API avant go-live |
| Fichiers audio non disponibles | Catalogue vide au lancement | Epic 13 bloquee en attente de l'associe |
| Webhook Stripe mal configure | Paiements non synchronises | Tests end-to-end Stripe CLI avant deploiement |

---

## Plan d'Implementation

### Epic 1 : Foundation & Setup

#### Story 1.1 : Initialisation du projet Next.js
- [x] 1.1.1 : Initialiser Next.js 15 avec TypeScript (`create-next-app`) dans le dossier actuel
- [x] 1.1.2 : Configurer Tailwind CSS v4 avec le design system Lalason (variables CSS couleurs, spacings, font Poppins via Google Fonts)
- [x] 1.1.3 : Installer et configurer shadcn/ui (theme sombre, composants de base)
- [x] 1.1.4 : Installer les dependances core : `zustand`, `zod`, `next-intl`, `drizzle-orm`, `@supabase/supabase-js`, `@supabase/ssr`, `stripe`, `posthog-js`
- [x] 1.1.5 : Configurer `.env.local` avec toutes les variables (Supabase URL+anon key, Stripe keys, PostHog key)
- [x] 1.1.6 : Configurer `next.config.ts` (next-intl plugin, headers de securite CSP/HSTS, redirections 301)
- [x] 1.1.7 : Creer la structure des repertoires (`src/app`, `src/components`, `src/lib`, `src/db`, `messages/`)
- [x] 1.1.8 : Configurer `.gitignore` (`.env.local`, `node_modules`, `.next`, fichiers audio)
- [x] 1.1.9 : Deployer sur Vercel et verifier que le build passe

#### Story 1.2 : Design System
- [x] 1.2.1 : Extraire les tokens de design depuis les screenshots (couleurs exactes : fond sombre, accent dore, blanc, etc.)
- [x] 1.2.2 : Creer `src/styles/globals.css` avec toutes les variables CSS (`--color-bg-primary`, `--color-accent`, `--color-text-primary`, etc.)
- [x] 1.2.3 : Configurer `tailwind.config.ts` pour utiliser les variables CSS comme couleurs Tailwind
- [x] 1.2.4 : Creer les composants shadcn/ui de base : Button, Input, Card, Badge, Skeleton, Dialog
- [x] 1.2.5 : Creer le composant `<Typography>` avec les variantes Poppins (hero, h1-h4, body, caption)

---

### Epic 2 : Base de donnees

- [x] 2.1.1 : Configurer Drizzle ORM (`drizzle.config.ts`, connexion Supabase)
- [x] 2.1.2 : Schema `profiles` (extension auth.users : role, stripe_customer_id, subscription_status, subscription_end_date)
- [x] 2.1.3 : Schema `artists` (id, slug, nom, bio_fr, bio_en, photo_url)
- [x] 2.1.4 : Schema `categories` (id, type STYLE|THEME|MOOD, slug, label_fr, label_en)
- [x] 2.1.5 : Schema `tracks` (id, slug, titre, artiste_id, duree, bpm, fichier_full_path, fichier_preview_path, cover_url, date_ajout, is_published)
- [x] 2.1.6 : Schema `track_categories` (junction table many-to-many)
- [x] 2.1.7 : Schema `blog_posts` (id, slug, titre, contenu_html, categorie_id, auteur, cover_url, meta_title, meta_description, published_at, is_published)
- [x] 2.1.8 : Schema `subscriptions` (id, user_id, stripe_subscription_id, stripe_price_id, plan_type, status, current_period_end)
- [x] 2.1.9 : Schema `downloads` (id, user_id, track_id, downloaded_at)
- [x] 2.1.10 : Schema `youtube_channels` (id, user_id, channel_id, submitted_at, status, processed_at)
- [x] 2.1.11 : Generer et appliquer la migration Drizzle sur Supabase
- [x] 2.1.12 : Configurer les RLS Policies (tracks full = abonnes actifs, previews = public, blog = public, profiles = owner)
- [ ] 2.1.13 : Creer les buckets Storage (`audio-full` prive, `audio-previews` public, `covers` public, `artist-photos` public)

---

### Epic 3 : Authentification

- [ ] 3.1.1 : Configurer Supabase Auth (email/password + Google OAuth dans le dashboard Supabase)
- [x] 3.1.2 : Creer les clients Supabase server-side et client-side
- [x] 3.1.3 : Creer le middleware Next.js (next-intl + verification session Supabase)
- [x] 3.1.4 : Proteger les routes `/[locale]/membre/*`
- [x] 3.1.5 : Proteger les routes `/admin/*` (role admin uniquement)
- [x] 3.2.1 : Page `/[locale]/connexion` (email/password + bouton Google)
- [x] 3.2.2 : Page `/[locale]/inscription` (email/password + bouton Google)
- [x] 3.2.3 : Page `/[locale]/mot-de-passe-oublie`
- [x] 3.2.4 : Page `/[locale]/auth/callback` (traitement OAuth + magic link)
- [x] 3.2.5 : Gestion des etats d'erreur auth
- [x] 3.2.6 : Redirection post-login vers la page precedente (ou dashboard membre)

---

### Epic 4 : Layout & Navigation

- [x] 4.1.1 : Composant `<Header>` (logo, menu desktop, burger mobile, selecteur langue, bouton connexion)
- [x] 4.1.2 : Composant `<Footer>` (liens legaux, newsletter, reseaux sociaux)
- [x] 4.1.3 : Selecteur de langue FR/EN (preserve la page courante)
- [x] 4.1.4 : Layout racine `src/app/[locale]/layout.tsx` (Header + Footer + Player + Provider Zustand)
- [x] 4.1.5 : Configurer next-intl + `messages/fr.json` + `messages/en.json` (toutes les cles UI)

---

### Epic 5 : Pages Publiques Statiques

#### Story 5.1 : Page d'accueil
- [x] 5.1.1 : Section Hero (titre, sous-titre, CTA)
- [x] 5.1.2 : Section catalogue apercu (6-8 morceaux populaires avec player inline)
- [x] 5.1.3 : Section categories (styles/themes/humeurs avec liens)
- [x] 5.1.4 : Section social proof / temoignages
- [x] 5.1.5 : Section artistes (apercu 7 artistes)
- [x] 5.1.6 : Section CTA abonnement
- [x] 5.1.7 : Formulaire newsletter MailerLite (route `/api/newsletter/subscribe`)
- [x] 5.1.8 : Meta tags SEO + schema markup Organization

#### Story 5.2 : Page Abonnements
- [x] 5.2.1 : Page `/[locale]/abonnements` avec 2 offres (Createurs + Boutique)
- [x] 5.2.2 : Toggle mensuel/annuel anime
- [x] 5.2.3 : Affichage economie annuelle ("Economisez 33%")
- [x] 5.2.4 : CTA vers `/api/checkout/create-session`
- [x] 5.2.5 : Lien CGV sous le bouton de paiement

#### Story 5.3 : Artistes + Pages Legales
- [x] 5.3.1 : Page `/[locale]/nos-artistes` (grille 7 artistes)
- [x] 5.3.2 : Page detail `/[locale]/nos-artistes/[slug]` (bio + morceaux)
- [x] 5.4.1 : Page mentions-legales
- [x] 5.4.2 : Page politique-de-confidentialite
- [x] 5.4.3 : Page cgv
- [x] 5.4.4 : Page cgu
- [x] 5.4.5 : Page faq
- [x] 5.4.6 : Page contact (formulaire → email admin)

---

### Epic 6 : Catalogue & Player Audio

#### Story 6.1 : Player audio persistant
- [x] 6.1.1 : Store Zustand `usePlayerStore` (currentTrack, isPlaying, progress, volume, queue, isSubscribed)
- [x] 6.1.2 : Composant `<PlayerDesktop>` (barre fixe bas, ~80px, pleine largeur)
- [x] 6.1.3 : Composant `<PlayerMobileMini>` (barre fixe bas, ~60px)
- [x] 6.1.4 : Composant `<PlayerMobileExpanded>` (glisse vers le haut)
- [x] 6.1.5 : Logique 30s non-abonnes (pause auto + CTA dore anime)
- [x] 6.1.6 : URLs signees Supabase pour les fichiers audio (1h expiry)
- [x] 6.1.7 : Prev/next + barre de progression interactive + volume
- [x] 6.1.8 : Tests persistance player pendant navigation

#### Story 6.2 : Page Catalogue
- [x] 6.2.1 : Service `trackService.ts` (getAll, getBySlug, getByCategory, search)
- [x] 6.2.2 : Page `/[locale]/catalogue` (grille paginee, 20 morceaux/page)
- [x] 6.2.3 : Composant `<TrackCard>` (titre, artiste, duree, tags, play, download)
- [x] 6.2.4 : Composant `<CatalogueFilters>` (style, theme, humeur, combinables, URL mise a jour immediate)
- [x] 6.2.5 : Recherche Full-Text Search Supabase (`to_tsquery`)
- [x] 6.2.6 : Sous-pages `/[locale]/par-style/[slug]`, `/[locale]/par-theme/[slug]`, `/[locale]/par-humeur/[slug]` (ISR)
- [x] 6.2.7 : Meta tags dynamiques catalogue

---

### Epic 7 : Integration Stripe

- [x] 7.1.1 : Service `stripeService.ts` (createCheckoutSession, createPortalSession, getSubscription)
- [x] 7.1.2 : Route API `/api/checkout/create-session` (valide auth, cree session Stripe)
- [x] 7.1.3 : Page `/[locale]/abonnement/succes` (confirmation post-paiement)
- [x] 7.1.4 : Page `/[locale]/abonnement/annule` (retour si abandon checkout)
- [x] 7.1.5 : Route webhook `/api/webhooks/stripe` avec verification de signature
- [x] 7.1.6 : Handler `checkout.session.completed` (creation subscription DB + activation acces)
- [x] 7.1.7 : Handler `customer.subscription.updated` (MAJ plan/status)
- [x] 7.1.8 : Handler `customer.subscription.deleted` (desactivation acces)
- [x] 7.1.9 : Handler `invoice.payment_failed` (marquer echec)
- [ ] 7.1.10 : Tests end-to-end avec Stripe CLI
- [ ] 7.1.11 : Configuration webhook production sur Stripe dashboard

---

### Epic 8 : Espace Membre

- [x] 8.1.1 : Page `/[locale]/membre` (dashboard : plan actif, date renouvellement, nb telechargements)
- [x] 8.1.2 : Historique telechargements (20 derniers, pagines)
- [x] 8.1.3 : Bouton "Gerer mon abonnement" → Stripe Customer Portal
- [x] 8.1.4 : Formulaire Channel ID YouTube (input + validation + sauvegarde)
- [ ] 8.1.5 : Notification email admin a la soumission Channel ID
- [x] 8.1.6 : Composant `<SubscriptionStatus>` (badge Actif/Expire/Gratuit)

---

### Epic 9 : Blog

- [x] 9.1.1 : Service `blogService.ts` (getAll, getBySlug, getByCategory)
- [x] 9.1.2 : Page `/[locale]/blog` (liste, pagination 10/page, filtre categories)
- [x] 9.1.3 : Composant `<BlogCard>` (titre, extrait, date, categorie, cover)
- [x] 9.1.4 : Page detail `/[locale]/blog/[slug]` (ISR, HTML sanitise, meta tags)
- [x] 9.1.5 : Filtres par categorie (Guides, YouTube & Createurs, Cas d'usage, Artistes & Coulisses)
- [x] 9.1.6 : Articles lies en bas de chaque article
- [ ] 9.2.1 : Script `scripts/migrate-blog.ts` (richContent Wix → HTML → Supabase)
- [ ] 9.2.2 : Mapping des 38 articles vers les 4 categories
- [ ] 9.2.3 : Execution migration (verification 38 articles en base)

---

### Epic 10 : SEO & Redirections

- [x] 10.1.1 : Helper `generateMetadata()` reutilisable (title, description, OG, hreflang)
- [x] 10.1.2 : Meta tags dynamiques sur toutes les pages
- [x] 10.1.3 : Sitemap automatique `src/app/sitemap.ts`
- [x] 10.1.4 : Robots.txt `src/app/robots.ts`
- [x] 10.1.5 : Schema markup Organization (home)
- [x] 10.1.6 : Schema markup Article (blog)
- [x] 10.1.7 : Schema markup Product (abonnements)
- [ ] 10.2.1 : Audit exhaustif des URLs Wix actuelles
- [ ] 10.2.2 : Mapping redirections 301 dans `next.config.ts`
- [ ] 10.2.3 : Tests des redirections (`curl -I`)

---

### Epic 11 : Tracking & Analytics

- [x] 11.1.1 : PostHog avec consentement opt-in
- [x] 11.1.2 : Banniere cookies RGPD (`<CookieBanner>`)
- [x] 11.1.3 : Evenements funnel : `track_play`, `preview_ended`, `signup_start`, `signup_complete`, `checkout_start`, `subscription_active`
- [x] 11.1.4 : Vercel Analytics + Speed Insights dans `layout.tsx`
- [ ] 11.1.5 : Audit Lighthouse pages principales (cible > 90)

---

### Epic 12 : Admin Dashboard (MVP)

- [x] 12.1.1 : Layout `/admin/layout.tsx` avec garde role admin
- [x] 12.1.2 : Page `/admin` (KPIs : abonnes actifs, MRR/ARR depuis Stripe API, nb morceaux, nb articles)
- [x] 12.1.3 : Page `/admin/youtube-channels` (liste Channel IDs, statut pending/done, bouton "Marquer traite")
- [x] 12.1.4 : Route API `/api/admin/youtube-channels/[id]/process`
- [x] 12.1.5 : Seeder utilisateur admin en base

---

### Epic 13 : Migration des Donnees (bloquee — en attente associe)

- [ ] 13.1.1 : Script `scripts/migrate-catalogue.ts` (Excel/CSV → DB : tracks + categories + artistes)
- [ ] 13.1.2 : Script `scripts/generate-previews.sh` (ffmpeg : couper 30s de chaque fichier audio)
- [ ] 13.1.3 : Upload fichiers audio complets → bucket `audio-full` (prive)
- [ ] 13.1.4 : Upload previews 30s → bucket `audio-previews` (public)
- [ ] 13.1.5 : Upload covers → bucket `covers` (public)
- [ ] 13.1.6 : Verification 306 morceaux en base avec fichiers associes
- [x] 13.2.1 : Script `scripts/sync-stripe-subscriptions.ts` (Stripe API → DB)
- [ ] 13.2.2 : Verification acces des 35 abonnes existants

---

## Ordre d'Implementation Recommande

```
Phase A — Fondations        Epic 1 + 2 + 3
Phase B — Squelette visible Epic 4 + 5
Phase C — Core feature      Epic 6 + 7
Phase D — Membre + Blog     Epic 8 + 9
Phase E — Finitions         Epic 10 + 11 + 12
Phase F — Migration donnees Epic 13 (quand fichiers associe disponibles)
```

---

## Resume

- **13 epics**, **~90 taches**
- **Projet greenfield** — aucun fichier existant a modifier
- **Stack** : Next.js 15 + TypeScript + Tailwind + Supabase + Drizzle + Stripe + Zustand + next-intl

### Decisions validees
- [x] Zustand pour le state management du player
- [x] HTML pour le contenu blog (converti depuis richContent Wix)
- [x] Pre-generation des previews 30s avec ffmpeg
- [x] ISR pour les pages catalogue/blog, SSR pour les pages dynamiques
- [ ] Tokens de design a confirmer (couleurs exactes) — screenshosts haute resolution necessaires

### Pret pour le build ?
**Oui** — Epics 1 a 12 peuvent demarrer immediatement.
Epic 13 demarre quand les fichiers sont disponibles.
