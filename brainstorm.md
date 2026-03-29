# Brainstorm — Migration Lalason (Wix → In-House)

> **Derniere mise a jour :** 2026-03-13
> **Statut :** En cours — Phase de discovery
> **Participants :** Emil (fondateur) + Claude Code

---

## 1. Contexte & Problematique

### Ce qu'est Lalason
- SaaS de catalogue de musique libre de droit, fonde en 2018 (projet initial "Vendredi", 100M+ ecoutes)
- Modele par abonnement : les abonnes payants peuvent utiliser les musiques sous licence
- Heberge actuellement sur Wix (Thunderbolt renderer)
- Site uniquement en francais
- ~306 morceaux actuellement, objectif 1000 a court terme
- 35 abonnes actifs
- 7 artistes francais (Nyvvik, VDGL, Cyril Girard, Jaxsyn, Quynzelle, Konqeson, Boris Massot)
- Integration YouTube (whitelist Channel ID pour eviter les reclamations Content ID)

### Pourquoi migrer
- **Taux de conversion insuffisant** sur Wix
- **Limitations techniques** de Wix (rendu 100% JavaScript, personnalisation, performance, SEO)
- **Ambition mondiale** : besoin d'internationalisation FR/EN
- **Besoin de features avancees** : recherche musicale, annotation AI, back-office admin
- **Controle total** sur le code, les donnees, et l'experience utilisateur
- **Perte d'abonnes recente** suite a une augmentation de prix mal geree (pas de grandfathering)

### Ce qu'on veut conserver
- Toutes les musiques de la base de donnees Wix (306 morceaux + metadonnees)
- Tous les articles de blog (39 articles)
- La direction artistique (designs du freelance) — reproduction fidele, zero regression
- Les slugs/URLs existants (pour le SEO) — sauf ceux qui sont casses (voir audit)

### Modele economique actuel
| Offre | Prix | Detail |
|-------|------|--------|
| **Abonnement Createurs mensuel** | 15,99 EUR/mois | Acces illimite, telechargements, licence, monetisation complete |
| **Abonnement Createurs annuel** | 99 EUR/an | Idem mensuel, economie ~33% |
| **Licence unitaire** | 40 EUR/morceau | Licence perpetuelle (A SUPPRIMER dans le nouveau site) |
| **Abonnement Boutique** | 99,99 EUR/an | Pour espaces accueillant du public (sans SACEM) |

**Decision prise :** Supprimer l'achat a l'unite dans le nouveau site.
**Decision prise :** Les hausses de prix futures ne s'appliqueront qu'aux nouveaux abonnes (grandfathering).

### Comptes existants
- **Stripe** : Compte actif avec clients existants → migration des abonnements a prevoir
- **Domaine** : lalason.com — achete directement chez Wix → migration DNS a prevoir (transfert registrar ou repointer vers Vercel)

---

## 2. Audit du Site Actuel (lalason.com)

### 2.1 Inventaire complet des pages

#### Pages principales
| Page | URL actuelle | Statut |
|------|-------------|--------|
| Accueil | `/` | OK |
| Abonnements | `/abonnements` | OK |
| Nos Artistes | `/nos-artistes` | OK |
| Contact | `/contact` | OK |
| FAQ | `/faq` | Non indexee Google |
| Blog | `/blog-musique-libre-de-droits` | OK (39 articles) |
| Mentions legales | `/mentions-legales` | OK mais non indexee |
| Politique de confidentialite | `/politique-de-confidentialite` | OK mais non indexee |

#### Pages offres (DOUBLONS PROBLEMATIQUES)
| Page | URL actuelle | Probleme |
|------|-------------|----------|
| Offre Createurs | `/copie-de-nos-offres` | Slug Wix auto-genere, jamais renomme |
| Offre Createurs (copie) | `/copie-de-nos-offres-1` | Doublon du precedent |
| Musique Createurs | `/musique-pour-createur-de-contenus` | Troisieme page sur le meme sujet |
| Abonnement Boutique | `/abonnement-musiques-en-boutique` | Slug trop long |

**4 pages pour essentiellement 2 offres → cannibalisation SEO et confusion UX.**

#### Catalogue — Par Style (8 sous-pages)
| Style | URL |
|-------|-----|
| Index | `/par-style` |
| Cinematique | `/par-style/cinematique` |
| Electronique | `/par-style/electronique` |
| Hip-Hop / Urban | `/par-style/hip-hop-urban` |
| Chill-out | `/par-style/chill-out` |
| Funk / Jazz | `/par-style/funk-jazz` |
| Lofi | `/par-style/lofi` |
| World | `/par-style/world` |
| **Pop Rock** | **`/pop-rock`** (ORPHELINE — hors de `/par-style/`) |

#### Catalogue — Par Theme (9 sous-pages)
| Theme | URL |
|-------|-----|
| Index | `/par-theme` |
| Jeu video | `/par-theme/jeu-video` |
| Sport | `/par-theme/sport` |
| Documentaire | `/par-theme/documentaire` |
| Vlog | `/par-theme/vlog` |
| Film | `/par-theme/film` |
| Publicite | `/par-theme/publicite` |
| Voyage / Nature | `/par-theme/voyage-nature` |
| Tutoriel | `/par-theme/tutoriel` |
| Meditation | `/par-theme/meditation` |

#### Catalogue — Par Humeur (7 sous-pages)
| Humeur | URL |
|--------|-----|
| Index | `/par-humeur` |
| Energique | `/par-humeur/energique` |
| Romantique | `/par-humeur/romantique` |
| Heureux | `/par-humeur/heureux` |
| Calme | `/par-humeur/calme` |
| Suspens | `/par-humeur/suspens` |
| Dramatique | `/par-humeur/dramatique` |
| Triste | `/par-humeur/triste` |

**Total : ~43 pages statiques + 39 articles de blog = ~82 URLs indexees.**

### 2.2 Problemes critiques identifies

#### PROBLEME 1 — Absence de CGV/CGU
**Il n'existe aucune page de Conditions Generales de Vente (CGV) ni de Conditions Generales d'Utilisation (CGU).** C'est une **obligation legale** pour un site e-commerce francais vendant des abonnements. `/cgv`, `/cgu`, `/conditions-generales` renvoient tous des 404.
→ **A corriger imperativement dans le nouveau site.**

#### PROBLEME 2 — Pages doublons avec slugs Wix auto-generes
Les pages `/copie-de-nos-offres` et `/copie-de-nos-offres-1` sont des noms generes automatiquement par Wix lors de la duplication de pages. Elles sont indexees par Google avec le meme title tag, creant du contenu duplique.
→ **Ne pas reproduire. Creer une seule page pricing claire.**

#### PROBLEME 3 — Page orpheline `/pop-rock`
Cette page est au premier niveau (`/pop-rock`) alors que tous les autres styles sont sous `/par-style/`. Incoherence dans l'arborescence.
→ **Integrer sous `/par-style/pop-rock` + redirect 301 depuis `/pop-rock`.**

#### PROBLEME 4 — Rendu 100% JavaScript (CSR)
Le site Wix ne fournit aucun contenu HTML statique. Tout est charge dynamiquement par JavaScript. Impact :
- SEO degrade (Google doit executer le JS pour indexer)
- Performance de premier chargement lente
- Accessibilite compromise
- Partage sur reseaux sociaux potentiellement casse (OG tags)
→ **Resolu nativement par la migration vers Next.js (SSR/SSG).**

#### PROBLEME 5 — Pages de categories non indexees
Plusieurs sous-pages ne sont pas visibles dans les resultats Google :
- `/par-style/cinematique`, `/par-style/hip-hop-urban`, `/par-style/chill-out`, `/par-style/world`, `/par-style/funk-jazz`
- `/par-theme/vlog`, `/par-theme/film`
- `/par-humeur/romantique`, `/par-humeur/heureux`
- La page parent `/par-humeur` elle-meme
→ **Probablement du au rendu CSR. Sera resolu par le SSR.**

#### PROBLEME 6 — Confusion navigation publique vs membres
Les sous-menus du catalogue sont marques "Membre", creant de la confusion pour les visiteurs non connectes. La proposition de valeur n'est pas claire avant l'inscription.
→ **Modele freemium : tout visible, telechargement/licence reserve aux abonnes.**

### 2.3 Points positifs a conserver

- **Architecture du catalogue en 3 axes** (style, theme, humeur) — pertinente et correspond aux modes de recherche des createurs
- **Titles SEO bien optimises** — "Musique [type] Libre de Droit - Sons Exclusifs | Lalason"
- **Blog actif** avec 39 articles couvrant des sujets varies (guides, cas d'usage, temoignages)
- **Proposition de valeur differenciante** — musique exclusive par des artistes francais (pas une banque de sons generique)
- **Integration YouTube avec whitelist Content ID** — differenciateur fort
- **Design sombre/dark mode** — coherent avec l'univers musical (Spotify, Epidemic Sound)

---

## 3. Perimetre du Projet

### Phase 1 — MVP : Reproduction amelioree du site actuel

#### Pages a creer
- **Accueil** — Hero + proposition de valeur + sections thematiques + CTA
- **Catalogue unifie** — Page `/catalogue` comme point d'entree unique avec filtres (style, theme, humeur) + sous-pages par categorie
- **Page morceau** — Detail d'un morceau avec player, tags, licence
- **Abonnements/Pricing** — UNE seule page claire (createurs + boutique)
- **Nos Artistes** — Fiches artistes avec bio et portfolio
- **Blog** — Index + articles avec categories structurees
- **FAQ** — Questions frequentes avec schema markup
- **Contact** — Formulaire de contact
- **Pages legales** — Mentions legales, politique de confidentialite, **CGV, CGU** (manquantes actuellement !)
- **Auth** — Inscription, connexion, mot de passe oublie
- **Espace membre** — Dashboard, telechargements, gestion abonnement, whitelist YouTube

#### Fonctionnalites
- Player audio persistant (bas de page, reste pendant la navigation)
- Preview audio pour non-abonnes / ecoute complete pour abonnes
- Systeme d'abonnement via Stripe (mensuel, annuel, boutique)
- Authentification (email/password + social login)
- i18n FR/EN
- SEO optimise (SSR, meta tags, schema markup, sitemap)
- Tracking (PostHog + Vercel Analytics)
- Redirections 301 pour toutes les URLs modifiees

### Phase 2 — Ameliorations
- Barre de recherche avancee (Meilisearch)
- Upload de sons avec annotation automatique par AI
- Back-office admin (tracking, data, revenus, gestion blog, gestion catalogue)
- Favoris / playlists utilisateur
- Recommandations de morceaux similaires

---

## 4. Choix Technologiques — Analyse & Challenge

### 4.1 Framework Frontend — Next.js (App Router)

| Option | Pour | Contre |
|--------|------|--------|
| **Next.js (App Router)** | SSR/SSG natif (SEO), ecosysteme immense, deploiement Vercel optimal, React Server Components | Courbe d'apprentissage App Router |
| Nuxt.js (Vue) | Plus simple d'acces, SSR natif | Ecosysteme plus petit |
| Astro | Ultra performant pour le contenu statique | Moins adapte pour un SaaS interactif |
| Remix | Excellent data loading | Ecosysteme plus jeune |

**Recommandation : Next.js (App Router)** — Le plus coherent avec Vercel, le plus supporte, le meilleur pour le SEO d'un site avec du contenu dynamique + des pages marketing.

---

### 4.2 Hebergement — Vercel

**Recommandation : Vercel** — Deploiement automatique depuis GitHub, preview URLs, integration Next.js native. **Plan gratuit** suffisant pour le volume actuel (35 abonnes). Upgrade Pro (~20$/mois) uniquement si necessaire.

---

### 4.3 Base de donnees — Supabase

| Option | Pour | Contre |
|--------|------|--------|
| **Supabase** | PostgreSQL, Auth integre, Storage, RLS, API auto-generee, gratuit genereux | Vendor lock-in (mais PostgreSQL standard) |
| Firebase | Temps reel, Auth simple | NoSQL, pricing imprevisible |
| PlanetScale | MySQL performant | Pas d'auth/storage integre |
| Neon | PostgreSQL serverless | Pas d'auth/storage integre |

**Recommandation : Supabase** — PostgreSQL pour les relations complexes (musiques <-> categories <-> utilisateurs <-> abonnements), Auth integre, Row Level Security pour le contenu payant. **Plan gratuit** suffisant pour demarrer (500 MB DB, 1 GB storage, 50k auth users).

---

### 4.4 Authentification — Supabase Auth

**Recommandation : Supabase Auth** — Integre, gratuit, social login (Google, etc.) + magic links + email/password. Bien integre avec RLS.

---

### 4.5 Paiement — Stripe

Configuration prevue :
- **Stripe Checkout** pour la page de paiement (heberge = PCI compliance)
- **Stripe Customer Portal** pour la gestion d'abonnement
- **Webhooks Stripe → Supabase** pour synchroniser le statut d'abonnement
- **Stripe Billing** pour les plans/prix
- **Grandfathering** : les hausses de prix ne s'appliquent qu'aux nouveaux abonnes

Plans a configurer :
| Plan | Prix | Stripe Product |
|------|------|----------------|
| Createurs mensuel | 15,99 EUR/mois | Subscription recurring monthly |
| Createurs annuel | 99 EUR/an | Subscription recurring yearly |
| Boutique annuel | 99,99 EUR/an | Subscription recurring yearly |

Migration Stripe : Les abonnements existants restent actifs sur Stripe. On connecte le nouveau site au meme compte Stripe. Les clients existants gardent leurs conditions tarifaires.

---

### 4.6 Internationalisation — next-intl

**Recommandation : next-intl** — Meilleure integration avec App Router Next.js.

Structure des URLs :
- `lalason.com/fr/...` (francais — langue par defaut)
- `lalason.com/en/...` (anglais)
- Redirect automatique selon la langue du navigateur

**Impact sur les slugs existants :** Les URLs actuelles (sans prefixe de langue) devront rediriger :
- `/par-style/lofi` → `301` → `/fr/par-style/lofi`
- Cela necessite un mapping complet de redirections 301

---

### 4.7 Recherche musicale

**Phase 1 : Supabase Full-Text Search** — Suffisant avec des filtres par categorie/theme/humeur.
**Phase 2 : Meilisearch** — Recherche instantanee, typo-tolerant, faceting par genre/duree/BPM/mood.

---

### 4.8 Annotation AI des sons (Phase 2)

**Recommandation : Approche hybride**
1. **Essentia** (open source) pour l'analyse technique : BPM, tonalite, energie, duree
2. **LLM** (Claude/GPT) pour l'annotation semantique : tags de mood, categories, description

Pour la Phase 1, on migre les annotations existantes telles quelles.

---

### 4.9 Tracking & Analytics — PostHog

**Recommandation : PostHog** — Event tracking, funnels de conversion, session replay, feature flags. Plan gratuit 1M events/mois. Completer avec Vercel Analytics pour les Web Vitals.

---

### 4.10 Stockage des fichiers audio

| Option | Pour | Contre |
|--------|------|--------|
| **Supabase Storage** | Integre, simple | Egress payant, bande passante limitee |
| **Cloudflare R2** | Egress GRATUIT, CDN mondial | Service separe |
| AWS S3 + CloudFront | Standard industriel | Complexe, egress payant |

**Recommandation : Commencer avec Supabase Storage** (simplicite pour le MVP avec 306 morceaux et 35 abonnes) **puis migrer vers Cloudflare R2** quand le trafic augmente. Les deux sont compatibles S3.

A 306 morceaux et 35 abonnes, les couts de bande passante Supabase seront negligeables. Pas besoin d'optimiser prematurement.

---

### 4.11 Styling — Tailwind CSS + shadcn/ui

**Recommandation : Tailwind CSS + shadcn/ui** — Controle pixel-perfect pour reproduire le design, composants accessibles pour les elements d'interface.

**Methode de reproduction du design** (pas de Figma disponible) :
1. Screenshots haute resolution de chaque page du site Wix
2. Inspection des styles avec les outils de developpement du navigateur (couleurs, typos, spacings)
3. Extraction de la palette de couleurs et du systeme typographique
4. Creation d'un design system Tailwind reproduisant ces tokens

---

### 4.12 ORM — Drizzle

| Option | Pour | Contre |
|--------|------|--------|
| **Drizzle** | Leger, typesafe, proche du SQL, performant sur serverless | Plus jeune |
| Prisma | Tres populaire, DX excellente, migrations robustes | Plus lourd, cold starts lents sur serverless |
| Supabase JS Client | Zero dependance, integre | Pas de migration schema, moins typesafe |

**Recommandation : Drizzle** — Leger et performant sur Vercel (serverless), typesafe, proche du SQL. C'est le choix le plus adapte pour un projet ambitieux et scalable en 2026.

---

## 5. Architecture Envisagee

```
                    ┌─────────────────────────────┐
                    │        NAVIGATEUR            │
                    │  (Utilisateur / Admin)       │
                    └──────────┬──────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│                  Next.js 15 (App Router)                  │
│            Tailwind CSS + shadcn/ui                       │
│                  next-intl (i18n FR/EN)                   │
│                                                          │
│  Routes publiques :     Routes membres :    Routes admin: │
│  /[locale]/             /[locale]/membre/   /admin/*      │
│  /[locale]/catalogue/   /[locale]/membre/   (protegees)   │
│  /[locale]/blog/        downloads/                        │
│  /[locale]/abonnements/ /[locale]/membre/                 │
│                         whitelist-youtube/                │
│                                                          │
│              Deploye sur Vercel                           │
└──────────────┬──────────────┬────────────────────────────┘
               │              │
               ▼              ▼
┌──────────────────┐  ┌───────────────────┐
│   Supabase       │  │   Stripe          │
│  - Auth          │  │  - Checkout       │
│  - PostgreSQL    │  │  - Billing        │
│  - Row Level     │  │  - Webhooks  ──────── → Supabase
│    Security      │  │  - Customer       │     (sync statut)
│  - Storage       │  │    Portal         │
│  (fichiers audio)│  └───────────────────┘
└──────────────────┘
               │
               ▼
┌──────────────────┐  ┌───────────────────┐
│  Cloudflare R2   │  │   PostHog         │
│  (Phase 2 :     │  │  - Analytics      │
│   migration      │  │  - Funnels        │
│   si besoin)     │  │  - Session replay │
└──────────────────┘  └───────────────────┘
```

---

## 6. UX — Problemes & Recommandations

### PROBLEME 1 : Double page themes (publique vs membres) — DECISION PRISE
**Actuel :** Pages catalogue marquees "Membre" dans la navigation → les visiteurs ne voient pas le contenu.
**Decision :** Modele freemium valide. Une seule page par categorie. Tout le catalogue est visible. Le player diffuse un extrait (30s) pour les non-abonnes. Le telechargement et l'ecoute complete sont reserves aux abonnes. CTA "S'abonner pour ecouter en entier" bien visible. L'option gratuite avec credit + Content ID est conservee.

### PROBLEME 2 : 4 pages d'offres differentes
**Actuel :** `/abonnements`, `/copie-de-nos-offres`, `/copie-de-nos-offres-1`, `/abonnement-musiques-en-boutique` + `/musique-pour-createur-de-contenus`
**Recommandation :** UNE seule page `/abonnements` avec les 2 offres (Createurs + Boutique) presentees clairement cote a cote. Toggle mensuel/annuel. Comparatif des avantages.

### PROBLEME 3 : Pas de page catalogue unifiee
**Actuel :** L'URL `/catalogue` n'existe pas. L'utilisateur doit choisir entre 3 axes (style/theme/humeur) sans vue d'ensemble.
**Recommandation :** Creer une page `/catalogue` comme point d'entree unique avec :
- Barre de filtres combinables (style + theme + humeur)
- Grille de morceaux avec player inline
- Tri (recent, populaire, alphabetique)
- Acces rapide aux sous-categories via tags/chips

### PROBLEME 4 : Pas de recherche
**Actuel :** Aucune barre de recherche sur le site.
**Recommandation Phase 1 :** Au minimum, un champ de recherche sur la page catalogue qui filtre par titre/artiste. Phase 2 : Meilisearch avec recherche avancee.

### PROBLEME 5 : Blog sans categories
**Actuel :** 39 articles dans une seule categorie "Musique libre de droits", pas de filtrage.
**Recommandation :** Creer des categories de blog : Guides, Cas d'usage, Artistes, Actualites. Ajouter un sidebar ou des tags pour la navigation.

### PROBLEME 6 : Pas de player persistant
**Actuel :** Le player semble integre dans chaque page de categorie, pas de lecture continue entre les pages.
**Recommandation :** Player sticky en bas de page (comme Spotify/SoundCloud) qui persiste pendant la navigation. File d'attente de lecture.

### AMELIORATIONS UX SUPPLEMENTAIRES
- [ ] CTA "S'abonner" visible et coherent sur toutes les pages catalogue
- [ ] Temoignages avec vrais noms, photos, liens YouTube (credibilite)
- [ ] Indicateur de popularite sur les morceaux (nombre d'ecoutes/telechargements)
- [ ] Systeme de favoris (pour creer de l'engagement avant l'abonnement)
- [ ] Parcours d'onboarding apres inscription (whitelist YouTube, premiere ecoute)

---

## 7. Migration depuis Wix — Strategie

### Donnees a migrer
| Type | Volume | Source | Methode |
|------|--------|--------|---------|
| Catalogue musical (metadonnees) | 306 morceaux | Wix DB / API | Export CSV ou API Wix |
| Fichiers audio | 306 fichiers | Wix Media | Telechargement + re-upload Supabase |
| Articles de blog | 39 articles | Wix Blog | API Wix ou export |
| Utilisateurs | ~35 abonnes | Wix Members + Stripe | Stripe reste, recreer comptes Supabase |
| Design | Toutes les pages | Screenshots + DevTools | Reproduction manuelle |

### Plan de migration detaille

#### Etape 1 — Extraction des donnees
- Exporter le catalogue via l'API Wix (ou export CSV depuis le dashboard Wix)
- Telecharger tous les fichiers audio
- Exporter les articles de blog (texte, images, metadonnees SEO)
- Lister tous les utilisateurs/abonnes

#### Etape 2 — Capture du design
- Screenshots haute resolution de chaque page (desktop + mobile)
- Extraction des couleurs, typographies, spacings via DevTools
- Documentation du design system

#### Etape 3 — Construction du nouveau site
- Developper le site Next.js en parallele (sans toucher au site Wix)
- Importer les donnees dans Supabase
- Reproduire le design pixel-perfect

#### Etape 4 — Migration DNS et go-live
- Tester le nouveau site sur un sous-domaine (staging.lalason.com)
- Configurer les redirections 301
- Migrer le DNS de Wix vers Vercel
- Verifier que tous les abonnements Stripe fonctionnent
- Soumettre le nouveau sitemap a Google Search Console

### SEO — Redirections 301

URLs qui DOIVENT etre redirigees :
| Ancienne URL | Nouvelle URL | Raison |
|-------------|-------------|--------|
| `/copie-de-nos-offres` | `/fr/abonnements` | Slug casse |
| `/copie-de-nos-offres-1` | `/fr/abonnements` | Slug casse |
| `/abonnement-musiques-en-boutique` | `/fr/abonnements` | Consolidation |
| `/musique-pour-createur-de-contenus` | `/fr/catalogue` | Consolidation |
| `/pop-rock` | `/fr/par-style/pop-rock` | Correction arborescence |
| `/blog-musique-libre-de-droits` | `/fr/blog` | Simplification slug |
| Toutes les pages existantes sans `/fr/` | `/fr/[meme-slug]` | Ajout prefixe i18n |

---

## 8. Securite — Points Cles

- **Supabase Row Level Security (RLS)** — Policies par table pour controler l'acces
- **Stripe Checkout & Portal** — Zero donnee bancaire dans notre code
- **Webhooks Stripe signes** — Verification de signature obligatoire
- **Protection des fichiers audio** — URLs signees avec expiration (pas de liens directs)
- **Rate limiting** — Sur les API routes Next.js
- **Validation des inputs** — Zod pour la validation cote serveur
- **Headers de securite** — CSP, HSTS, X-Frame-Options (config Vercel)
- **RGPD** — Consentement cookies, droit a l'effacement, politique de confidentialite
- **CGV/CGU** — A creer (obligation legale actuellement non respectee)

---

## 9. Plan de Tracking — Evenements Cles

### Funnel de conversion
1. `page_view` — Arrivee sur le site
2. `catalog_browse` — Navigation dans le catalogue
3. `track_play` — Ecoute d'un morceau (preview ou complet)
4. `signup_start` — Debut d'inscription
5. `signup_complete` — Inscription terminee
6. `checkout_start` — Debut de paiement
7. `subscription_active` — Abonnement active

### Engagement
- `track_download` — Telechargement d'un morceau
- `track_favorite` — Ajout aux favoris
- `search_query` — Recherche effectuee (+ termes)
- `filter_applied` — Filtre utilise (categorie, mood, etc.)
- `blog_read` — Lecture d'article
- `youtube_whitelist` — Ajout d'une chaine YouTube

### Business
- `subscription_cancelled` — Desabonnement (+ raison si possible)
- `subscription_renewed` — Renouvellement
- `plan_changed` — Changement de plan (upgrade/downgrade)

---

## 10. Questions Ouvertes Restantes

### Repondu
- ~~URL du site~~ → lalason.com (analyse)
- ~~Taille du catalogue~~ → 306 morceaux, objectif 1000
- ~~Fichiers design~~ → Pas de Figma, reproduction depuis le site
- ~~Plans d'abonnement~~ → 15,99/mois, 99/an, 99,99 boutique, suppression unite
- ~~Compte Stripe~~ → Oui, actif avec clients
- ~~Nombre d'abonnes~~ → 35
- ~~Domaine~~ → lalason.com chez Wix

### Repondu (session 2)
- ~~Offre Boutique~~ → 99,99 EUR/an
- ~~Budget infra~~ → Approche lean : plans gratuits Vercel et Supabase suffisent pour le volume actuel (35 abonnes, 306 morceaux). On upgrade uniquement si necessaire.
- ~~Calendrier~~ → ASAP mais la qualite prime. Code irreprochable, securite totale, respect du cahier des charges. Pas de compromis sur la qualite pour aller plus vite.
- ~~Modele gratuit~~ → Modele freemium confirme : option gratuite (avec credit + Content ID) + abonnements payants
- ~~Migration domaine~~ → lalason.com achete directement chez Wix → transfert de domaine a prevoir

### Repondu (session 3)
- ~~Newsletter~~ → MailerLite (service externe, a conserver et integrer dans le nouveau site)

### Repondu (session 4)
- ~~Whitelist YouTube Content ID~~ → Process manuel. Musiques distribuees via DistroKid. Whitelist geree par un prestataire externe (frequencydigital.com) via leur customer portal, a la main. Quand un abonne paie via Stripe et ajoute son Channel ID dans son espace membre, l'admin recoit une notification et ajoute manuellement la chaine sur frequencydigital.com. Pas d'API a integrer — juste un formulaire Channel ID cote abonne + notification admin.

### A clarifier
(Aucune question bloquante pour la PRD)

---

## 11. Stack Technique Recapitulative

| Brique | Choix | Justification |
|--------|-------|---------------|
| **Framework** | Next.js 15 (App Router) | SSR/SSG, SEO, ecosysteme |
| **Hebergement** | Vercel | DX optimale, deploiement auto |
| **Base de donnees** | Supabase (PostgreSQL) | Auth + DB + Storage integres |
| **ORM** | Drizzle | Leger, typesafe, performant serverless |
| **Auth** | Supabase Auth | Integre, gratuit, RLS |
| **Paiement** | Stripe (Checkout + Billing + Portal) | Standard SaaS, compte existant |
| **Storage audio** | Supabase Storage (Phase 1) → Cloudflare R2 (Phase 2) | Simple d'abord, scalable ensuite |
| **i18n** | next-intl | Meilleure integration App Router |
| **Styling** | Tailwind CSS + shadcn/ui | Pixel-perfect, composants accessibles |
| **Recherche** | Supabase FTS (Phase 1) → Meilisearch (Phase 2) | Progression naturelle |
| **Analytics** | PostHog + Vercel Analytics | Funnels + Web Vitals |
| **Blog** | Supabase + editeur TipTap dans back-office | Centralise, controle total |
| **Validation** | Zod | Typage runtime, securite |
| **Annotation AI** | Phase 2 : Essentia + LLM | Open source + IA semantique |

---

## 12. Prochaines Etapes

1. **Repondre aux questions ouvertes restantes** (section 10)
2. **Valider la stack technique et les recommandations UX** ensemble
3. **Passer en mode PRD** (`/prd`) pour formaliser les specs
4. **Puis plan technique** (`/plan-tech`) pour l'architecture detaillee et le decoupage en taches
5. **Puis coder**
