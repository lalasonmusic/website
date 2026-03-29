# PRD : Migration Lalason — Wix vers Stack Custom (Phase 1 / MVP)

**Date** : 2026-03-14
**Auteur** : Emil (co-fondateur) + Claude Code
**Statut** : En review

---

## 1. Contexte et Probleme

### Contexte
Lalason est un SaaS de catalogue de musique libre de droit fonde en 2018 (projet initial "Vendredi", 100M+ ecoutes). Le service propose ~306 morceaux exclusifs par 7 artistes francais sous licence par abonnement. Le site est actuellement heberge sur Wix avec 36 membres (dont ~23 abonnes annuels, ~7 mensuels, ~4 boutique, 4 churnes) et un compte Stripe existant.

### Probleme
1. **Conversion insuffisante** — Wix impose des limitations (rendu 100% JavaScript, personnalisation reduite, SEO degrade) qui impactent directement le taux de conversion
2. **UX confuse** — 4 pages d'offres pour 2 plans, doublons de pages catalogue (publique vs membres), absence de page catalogue unifiee, pas de recherche
3. **Internationalisation impossible** — Site uniquement en francais, ambition mondiale bloquee
4. **Perte d'abonnes** — Augmentation de prix sans grandfathering ayant provoque des desabonnements
5. **Non-conformite legale** — Absence de CGV/CGU (obligation legale pour un site e-commerce francais)
6. **Pas de back-office** — Gestion manuelle sans tableau de bord admin

### Evidence
- Taux de conversion Wix juge insuffisant par l'equipe fondatrice
- Perte d'abonnes constatee apres hausse de prix (pas de protection des tarifs existants)
- 5 pages de categories non indexees par Google (rendu CSR)
- 4 pages doublons pour 2 offres (cannibalisation SEO)
- Page `/pop-rock` orpheline hors arborescence
- Aucune CGV/CGU (risque juridique)
- Prix FR et EN differents sur Wix (FR: 15,99 EUR/mois et 99,99 EUR/an vs EN: 7,99 EUR/mois et 76 EUR/an) — incoherence a corriger
- 1 254 contacts dans la base Wix, seulement 36 membres inscrits — potentiel de conversion inexploite

---

## 2. Objectif et Solution

### Objectif
Reproduire le site Lalason existant sur une stack custom avec :
- **Zero regression** sur le design (reproduction fidele de la direction artistique)
- **Correction** de tous les problemes UX, SEO et legaux identifies
- **Ajout** de l'internationalisation FR/EN
- **Modele freemium** : catalogue visible par tous, telechargement/ecoute complete reserves aux abonnes
- **Grandfathering** des prix pour les abonnes existants

### Metriques de succes
- 100% des pages du site actuel reproduites ou ameliorees
- 100% des redirections 301 fonctionnelles (zero perte SEO)
- Score Lighthouse Performance > 90 sur les pages principales
- Tous les abonnements Stripe existants fonctionnels apres migration
- CGV/CGU presentes et conformes

### Contrainte budget
Approche **lean** : utiliser les plans gratuits tant que suffisants.
- **Vercel** : plan Hobby (gratuit) — suffisant pour le trafic actuel
- **Supabase** : plan Free (gratuit) — 500 MB DB, 1 GB Storage, 50k auth users — largement suffisant pour 36 membres et 306 morceaux
- **Stripe** : pas d'abonnement, commission uniquement sur les transactions
- **PostHog** : plan gratuit (1M events/mois)
- **MailerLite** : plan gratuit (1 000 abonnes)

### Solution proposee
Migration complete vers Next.js 15 (App Router) deploye sur Vercel, avec Supabase (PostgreSQL + Auth + Storage) et Stripe pour les paiements. Reproduction pixel-perfect du design existant avec Tailwind CSS + shadcn/ui. Internationalisation FR/EN avec next-intl.

### Ce que ce n'est PAS
- Ce n'est **pas** une refonte du design — on reproduit fidelement l'existant
- Ce n'est **pas** la Phase 2 — pas de recherche avancee (Meilisearch), pas d'annotation AI, pas de favoris/playlists
- Ce n'est **pas** un back-office complet — seul un dashboard admin minimal est inclus (Phase 2 pour l'editeur de blog avance et la gestion catalogue)
- Ce n'est **pas** une migration automatique — les donnees seront migrees via scripts manuels

---

## 3. User Stories

### Story 1 : Visiteur decouvre le catalogue
**En tant que** visiteur non connecte,
**Je veux** parcourir le catalogue de musiques, filtrer par style/theme/humeur, et ecouter des extraits,
**Afin de** evaluer la qualite du catalogue avant de m'abonner.

**Criteres d'acceptation :**
- [ ] La page `/[locale]/catalogue` affiche la grille de tous les morceaux avec pagination (20 par page)
- [ ] Les filtres style, theme et humeur sont disponibles et combinables
- [ ] Chaque morceau affiche : titre, artiste, duree, tags de categorie
- [ ] Le clic sur "Play" lance un extrait de 30 secondes dans le player persistant
- [ ] Le player reste visible en bas de page pendant toute la navigation sur le site
- [ ] Les sous-pages `/[locale]/par-style/[slug]`, `/[locale]/par-theme/[slug]`, `/[locale]/par-humeur/[slug]` existent et sont fonctionnelles
- [ ] Un CTA "S'abonner" est visible sur chaque page du catalogue

### Story 2 : Visiteur consulte les offres
**En tant que** visiteur interesse,
**Je veux** voir clairement les offres d'abonnement et leurs avantages,
**Afin de** choisir le plan adapte a mes besoins.

**Criteres d'acceptation :**
- [ ] La page `/[locale]/abonnements` affiche les 2 offres (Createurs et Boutique) cote a cote
- [ ] Un toggle permet de basculer entre tarif mensuel (15,99 EUR) et annuel (99 EUR) pour l'offre Createurs
- [ ] L'offre Boutique affiche 99,99 EUR/an
- [ ] Chaque offre liste ses avantages specifiques
- [ ] L'economie annuelle par rapport au mensuel est visible (ex: "Economisez 33%")
- [ ] Un CTA par offre redirige vers Stripe Checkout
- [ ] Il n'existe aucune option d'achat a l'unite

### Story 3 : Visiteur s'inscrit et s'abonne
**En tant que** visiteur decide,
**Je veux** creer un compte et souscrire un abonnement,
**Afin d'** acceder au catalogue complet et telecharger des morceaux.

**Criteres d'acceptation :**
- [ ] L'inscription est possible par email/mot de passe et par social login (Google)
- [ ] Un email de confirmation est envoye apres inscription
- [ ] Apres inscription, l'utilisateur est redirige vers la page d'abonnements
- [ ] Le paiement passe par Stripe Checkout (page hebergee Stripe)
- [ ] Apres paiement valide, le statut d'abonnement est synchronise dans Supabase via webhook Stripe (delai < 30 secondes)
- [ ] L'utilisateur a immediatement acces au catalogue complet apres activation

### Story 4 : Abonne utilise le catalogue
**En tant qu'** abonne actif,
**Je veux** ecouter les morceaux en entier et les telecharger,
**Afin de** les utiliser dans mes projets de contenu.

**Criteres d'acceptation :**
- [ ] Le player lit le morceau entier (pas seulement l'extrait de 30s)
- [ ] Un bouton "Telecharger" est visible sur chaque morceau (fichier audio original)
- [ ] Le telechargement demarre immediatement au clic
- [ ] Les fichiers audio sont servis via des URLs signees avec expiration (pas de lien direct permanent)
- [ ] Un non-abonne qui tente de telecharger ou d'ecouter au-dela de 30s voit un CTA d'abonnement

### Story 5 : Abonne gere son compte
**En tant qu'** abonne,
**Je veux** gerer mon abonnement, voir mon historique, et configurer ma whitelist YouTube,
**Afin de** controler mon compte de facon autonome.

**Criteres d'acceptation :**
- [ ] L'espace membre `/[locale]/membre` affiche le dashboard avec : plan actif, date de renouvellement, historique de telechargements
- [ ] Un lien vers le Stripe Customer Portal permet de modifier/annuler l'abonnement
- [ ] Un champ "Channel ID YouTube" permet d'ajouter/modifier son identifiant de chaine
- [ ] La sauvegarde du Channel ID declenche une notification a l'admin (email ou dans le back-office)
- [ ] L'espace membre n'est accessible qu'aux utilisateurs connectes (redirection vers login sinon)

### Story 6 : Visiteur lit le blog
**En tant que** visiteur ou abonne,
**Je veux** lire des articles de blog sur la musique libre de droit,
**Afin de** m'informer et decouvrir des cas d'usage.

**Criteres d'acceptation :**
- [ ] La page `/[locale]/blog` affiche la liste des 38 articles migres avec pagination (10 par page)
- [ ] Chaque article a sa page dediee `/[locale]/blog/[slug]`
- [ ] Les articles affichent : titre, date, auteur, categorie, contenu, images
- [ ] Les 4 categories de blog sont filtrable : Guides, YouTube & Createurs, Cas d'usage, Artistes & Coulisses
- [ ] Les meta tags (title, description, OG) sont corrects pour chaque article

### Story 7 : Visiteur consulte les artistes
**En tant que** visiteur,
**Je veux** decouvrir les artistes du catalogue,
**Afin de** comprendre la proposition de valeur (musique exclusive par des artistes francais).

**Criteres d'acceptation :**
- [ ] La page `/[locale]/nos-artistes` affiche les 7 artistes avec photo, nom et courte bio
- [ ] Le clic sur un artiste montre sa fiche complete avec sa bio et ses morceaux
- [ ] Les morceaux de l'artiste sont jouables directement depuis sa fiche

### Story 8 : Visiteur utilise le site en anglais
**En tant que** visiteur anglophone,
**Je veux** naviguer sur le site en anglais,
**Afin de** comprendre l'offre et m'abonner.

**Criteres d'acceptation :**
- [ ] Toutes les pages sont disponibles en FR et EN
- [ ] Un selecteur de langue est present dans le header
- [ ] Les URLs suivent le pattern `/fr/...` et `/en/...`
- [ ] La langue par defaut est detectee via le navigateur
- [ ] Les contenus statiques (UI, labels, CTA) sont traduits dans les 2 langues
- [ ] Les contenus dynamiques (morceaux, blog) sont affiches dans leur langue d'origine (francais) avec l'UI en anglais
- [ ] Les meta tags SEO sont traduits pour chaque langue

### Story 9 : Admin recoit une notification de nouveau Channel ID
**En tant qu'** admin,
**Je veux** etre notifie quand un abonne ajoute ou modifie son Channel ID YouTube,
**Afin de** l'ajouter manuellement sur frequencydigital.com.

**Criteres d'acceptation :**
- [ ] L'admin recoit un email de notification contenant : nom de l'abonne, email, Channel ID soumis
- [ ] La notification inclut un lien vers le profil de l'abonne dans le back-office
- [ ] L'admin peut marquer le Channel ID comme "traite" dans le back-office

### Story 10 : Visiteur s'inscrit a la newsletter
**En tant que** visiteur,
**Je veux** m'inscrire a la newsletter Lalason,
**Afin de** recevoir les nouveautes et actualites.

**Criteres d'acceptation :**
- [ ] Un formulaire d'inscription newsletter est present sur la page d'accueil (et optionnellement en footer)
- [ ] L'inscription envoie l'email a MailerLite via leur API
- [ ] Un message de confirmation s'affiche apres inscription
- [ ] Le formulaire valide le format de l'email avant envoi

---

## 4. Specifications Fonctionnelles

### 4.1 Player Audio Persistant

- **Comportement** : Barre de player fixe en bas de page, visible sur toutes les pages du site. Reste active pendant la navigation (pas de rechargement entre les pages grace au App Router).

#### Desktop
- Barre fixe en bas, pleine largeur (~80px)
- Affiche tout en une ligne : pochette + titre + artiste + barre de progression + temps + volume + prev/next + bouton telecharger (abonne) ou CTA "S'abonner" (non-abonne)

#### Mobile — 2 etats
- **Mini bar** (defaut) : fixe en bas, ~60px. Affiche : pochette miniature + titre + artiste + play/pause. Ne masque pas les CTAs de la page.
- **Player etendu** (tap sur la mini bar) : glisse vers le haut. Affiche : barre de progression, volume, prev/next, details du morceau. Pour un non-abonne : bouton "S'abonner pour ecouter en entier" bien visible.

#### Fin d'extrait (moment cle de conversion)
- Quand l'extrait de 30 secondes se termine pour un non-abonne :
  - La mini bar se transforme en **CTA anime** avec fond dore (couleur accent du brand) : "Ce morceau continue... → S'abonner"
  - Pas de fermeture automatique — l'utilisateur doit agir (s'abonner ou choisir un autre morceau)
  - Sur le player etendu : le bouton "S'abonner" devient proéminent avec animation

- **Regles metier** :
  - Non-abonne : lecture limitee a un extrait de 30 secondes par morceau, puis CTA conversion
  - Abonne actif : lecture complete du morceau + bouton telecharger
  - Le player ne s'interrompt jamais pendant la navigation (persistance cross-page)
- **Etats** :
  - Vide (aucun morceau selectionne)
  - En lecture (morceau en cours)
  - En pause
  - Extrait termine (non-abonne → CTA dore)

### 4.2 Systeme d'Authentification

- **Methodes** : Email/mot de passe + Google OAuth (via Supabase Auth)
- **Pages** : `/[locale]/connexion`, `/[locale]/inscription`, `/[locale]/mot-de-passe-oublie`
- **Regles metier** :
  - Confirmation email obligatoire avant acces complet
  - Session persistante (refresh token)
  - Redirection post-login vers la page precedente (ou dashboard membre)
- **Etats utilisateur** :
  - Visiteur (non connecte)
  - Inscrit gratuit (compte sans abonnement)
  - Abonne actif (abonnement Stripe actif)
  - Abonne expire (abonnement annule/expire)
  - Admin

### 4.3 Integration Stripe

- **Checkout** : Redirection vers Stripe Checkout pour le paiement (heberge = PCI compliant)
- **Plans** (prix unifies FR/EN, remplacent les anciens plans Wix aux prix differents) :
  - Createurs mensuel : 15,99 EUR/mois (recurring)
  - Createurs annuel : 99 EUR/an (recurring)
  - Boutique annuel : 99,99 EUR/an (recurring)
- **Plus d'achat a l'unite** : L'option d'achat individuel a 40 EUR/morceau est supprimee definitivement
- **Webhooks** : Route API `/api/webhooks/stripe` recevant les evenements :
  - `checkout.session.completed` → activer l'abonnement
  - `customer.subscription.updated` → mettre a jour le plan
  - `customer.subscription.deleted` → desactiver l'abonnement
  - `invoice.payment_failed` → marquer le paiement comme echoue
- **Verification** : Signature webhook verifiee avec le secret Stripe
- **Customer Portal** : Lien vers le portal Stripe pour gestion autonome (modification carte, annulation, changement de plan)
- **Grandfathering** : Les prix dans Stripe sont geres par Product/Price. Les abonnes existants gardent leur Price ID historique. Les nouvelles hausses de prix creent de nouveaux Price IDs appliques uniquement aux nouveaux abonnes.

### 4.4 Catalogue Musical

- **Structure de donnees par morceau** :
  - Titre, artiste (relation), duree, BPM (si disponible)
  - Style(s), theme(s), humeur(s) — relations many-to-many
  - Fichier audio (reference Supabase Storage)
  - Fichier preview (extrait 30s, pre-genere)
  - Image/cover
  - Date d'ajout
  - Slug (pour l'URL)
- **Navigation** :
  - Page catalogue principale : grille paginee avec filtres combinables
  - Sous-pages par categorie : `/par-style/[slug]`, `/par-theme/[slug]`, `/par-humeur/[slug]`
  - Page detail morceau : `/catalogue/[slug]`
- **Recherche Phase 1** : Champ de recherche sur la page catalogue, filtrage par titre et artiste via Supabase Full-Text Search

### 4.5 Blog

- **Contenu** : 38 articles migres depuis Wix
- **Structure** : Titre, slug, contenu (HTML/Markdown), date de publication, auteur, categorie, image de couverture, meta title, meta description
- **Categories** (4, alignees sur le funnel de conversion) :
  - **Guides** — Contenu educatif, comment choisir, bonnes pratiques (haut de funnel, SEO)
  - **YouTube & Createurs** — Problemes de droits d'auteur, monetisation, temoignages (milieu de funnel, conversion)
  - **Cas d'usage** — Lalason en podcast, restaurant, hotellerie, evenementiel, magasin (bas de funnel, social proof)
  - **Artistes & Coulisses** — Portraits d'artistes, tendances musicales, behind the scenes (fidelisation)
- **Phase 1** : Articles geres directement dans Supabase (insertion via seed/migration). Edition via back-office Phase 2.
- **SEO** : Schema markup Article, meta tags, URLs canoniques

### 4.6 Pages Legales

- **A migrer telles quelles** :
  - `/[locale]/mentions-legales` — Mentions Legales
  - `/[locale]/politique-de-confidentialite` — Politique de Confidentialite
  - `/[locale]/cgv` — Conditions Generales de Vente (contenu existant conserve)
  - `/[locale]/cgu` — Conditions Generales d'Utilisation (contenu existant conserve)
- **Regles** : Les liens vers ces pages doivent etre dans le footer de toutes les pages. Le lien CGV doit etre present sur la page d'abonnements et dans le flow de checkout.
- **Note** : Le contenu legal existant est conserve tel quel pour la Phase 1. Une revision juridique pourra etre faite ulterieurement.

### 4.7 Page d'Accueil

- **Sections** (reproduites depuis le site Wix) :
  - Hero avec proposition de valeur et CTA principal
  - Selection de morceaux populaires (avec player inline)
  - Presentation des categories (style, theme, humeur) avec liens
  - Temoignages / social proof
  - Section artistes
  - CTA abonnement
  - Formulaire newsletter (MailerLite)
- **SEO** : H1 unique, meta tags optimises, schema markup Organization

### 4.8 Internationalisation

- **Langues** : Francais (defaut) et Anglais
- **Librairie** : next-intl
- **Structure URLs** : `/fr/...` et `/en/...`
- **Detection** : Redirection automatique selon `Accept-Language` du navigateur a la premiere visite
- **Fichiers** : `messages/fr.json` et `messages/en.json` pour les contenus statiques
- **Contenus dynamiques** : Les morceaux et articles de blog restent en francais. Seuls l'UI, les labels, les CTA, les pages legales et les meta tags sont traduits.
- **Traduction** : Les contenus statiques (UI, labels, CTA, meta tags) sont traduits par Claude Code. Pas de traduction professionnelle externe.

### 4.9 SEO

- **SSR/SSG** : Toutes les pages de contenu rendues cote serveur
- **Meta tags** : Title et description uniques par page, OG tags pour le partage social
- **Sitemap** : Genere automatiquement, soumis a Google Search Console
- **Redirections 301** : Mapping complet des anciennes URLs Wix vers les nouvelles URLs (cf. brainstorm section 7)
- **Schema markup** : Organization (accueil), Article (blog), FAQPage (FAQ), Product (abonnements)
- **URLs canoniques** : Sur chaque page, avec `hreflang` pour FR/EN
- **Robots.txt** : Configure pour permettre l'indexation des pages publiques

### 4.10 Tracking (PostHog + Vercel Analytics)

- **PostHog** : Event tracking pour le funnel de conversion et l'engagement (cf. brainstorm section 9)
- **Vercel Analytics** : Web Vitals et performance
- **Consentement** : Banner de consentement cookies RGPD. Tracking uniquement apres consentement.
- **Evenements critiques du funnel** :
  1. `page_view` → `catalog_browse` → `track_play` → `signup_start` → `signup_complete` → `checkout_start` → `subscription_active`

### 4.11 Whitelist YouTube / Content ID

- **Process** : Entierement manuel, pas d'integration API
- **Cote abonne** : Apres paiement, l'abonne peut renseigner son Channel ID YouTube dans son espace membre
- **Cote admin** : Notification (email + back-office) quand un Channel ID est soumis/modifie
- **Action admin** : L'admin ajoute manuellement la chaine sur frequencydigital.com (prestataire externe) via leur customer portal
- **Distribution** : Les morceaux sont distribues via DistroKid. Pas d'integration API avec DistroKid ou frequencydigital.

### 4.12 Back-office Admin (MVP minimal)

- **Acces** : Routes `/admin/*` protegees, accessibles uniquement aux utilisateurs avec le role `admin`
- **Dashboard** : Vue d'ensemble avec nombre d'abonnes actifs, revenus (via Stripe API), morceaux dans le catalogue
- **Notifications** : Liste des Channel IDs YouTube soumis par les abonnes, avec statut "a traiter" / "traite"
- **Pas inclus en Phase 1** : Editeur de blog, gestion catalogue, gestion utilisateurs avancee

### 4.13 Securite

- **RLS Supabase** : Policies par table — les fichiers audio complets ne sont accessibles qu'aux abonnes actifs
- **URLs signees** : Les fichiers audio sont servis via des URLs signees avec expiration (duree : 1 heure)
- **Webhooks Stripe** : Verification de signature obligatoire sur chaque requete
- **Rate limiting** : Sur les API routes (inscription, contact, newsletter)
- **Validation** : Tous les inputs utilisateur valides par Zod cote serveur
- **Headers** : CSP, HSTS, X-Frame-Options, X-Content-Type-Options configures sur Vercel
- **RGPD** : Consentement cookies, politique de confidentialite, droit a l'effacement

---

## 5. UX/UI

### Parcours utilisateur principal (conversion)

```
Arrivee (SEO/direct/social)
    │
    ▼
Page d'accueil — Decouverte de la proposition de valeur
    │
    ├──► Catalogue — Browse morceaux, ecoute extraits 30s
    │       │
    │       ├──► Clic "S'abonner" ou "Ecouter en entier"
    │       │       │
    │       │       ▼
    │       │   Page Abonnements — Choix du plan
    │       │       │
    │       │       ▼
    │       │   Inscription (si pas connecte)
    │       │       │
    │       │       ▼
    │       │   Stripe Checkout — Paiement
    │       │       │
    │       │       ▼
    │       │   Espace Membre — Catalogue complet + telechargements
    │       │
    │       └──► Sous-pages par categorie (style/theme/humeur)
    │
    ├──► Blog — Lecture d'articles
    │
    ├──► Nos Artistes — Decouverte des artistes
    │
    └──► FAQ / Contact / Pages legales
```

### Design et Direction Artistique

- **Reproduction fidele** du design existant — le freelance a fourni la DA, elle ne doit pas etre modifiee
- **Theme sombre (dark mode)** — coherent avec l'univers musical
- **Methode** : Screenshots haute resolution du site Wix actuel + extraction des tokens de design (couleurs, typos, spacings) via DevTools avant le debut du developpement
- **Design system** : Variables CSS Tailwind reproduisant exactement les tokens extraits
- **Font** : Poppins (Google Font) — une seule famille pour tout le site :
  - Menu/Navigation : Poppins Medium (500)
  - Paragraphes : Poppins Regular Italic (400)
  - Boutons : Poppins SemiBold (600)
  - Sous-titres : Poppins Medium (500)
  - Titres Hero : Poppins ExtraBold (800)
- **Responsive** : Mobile-first, breakpoints standard Tailwind

### Interactions cles

- **Player** : Play/pause instantane, barre de progression interactive (seek), volume, transition fluide entre morceaux
- **Filtres catalogue** : Application immediate (pas de bouton "Appliquer"), mise a jour de l'URL pour partageabilite
- **Toggle pricing** : Basculement mensuel/annuel fluide avec animation du prix
- **Navigation** : Transitions client-side (pas de rechargement complet) grace au App Router
- **Etats de chargement** : Skeleton loaders sur les grilles de morceaux et articles
- **Etats vides** : Message "Aucun resultat" avec suggestion de modifier les filtres
- **Etats d'erreur** : Message d'erreur clair avec action de retry

---

## 6. Hors Scope

Les elements suivants sont explicitement **hors scope** pour cette Phase 1 :

- **Recherche avancee Meilisearch** : Phase 2. Phase 1 utilise Supabase Full-Text Search basique.
- **Annotation AI des morceaux** : Phase 2. Les annotations existantes sont migrees telles quelles.
- **Editeur de blog dans le back-office** : Phase 2. Les 38 articles sont migres via seed. Les nouveaux articles sont ajoutes directement dans Supabase.
- **Gestion catalogue dans le back-office** : Phase 2. Les morceaux sont geres via Supabase Dashboard ou scripts.
- **Favoris / playlists utilisateur** : Phase 2.
- **Recommandations de morceaux similaires** : Phase 2.
- **Migration vers Cloudflare R2** : Phase 2. Phase 1 utilise Supabase Storage.
- **Achat a l'unite** : Supprime definitivement (pas de reimplementation).
- **Application mobile** : Pas prevu.
- **Chat / support en direct** : Pas prevu.

---

## 7. Risques et Questions Ouvertes

### Risques identifies

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Acces aux donnees Wix complique (pas d'API claire pour l'export) | Haut | Emil a les acces admin Wix — prevoir un export manuel si l'API ne suffit pas |
| Reproduction du design sans fichiers Figma (uniquement depuis screenshots) | Moyen | Extraction methodique des tokens de design via DevTools + validation iterative avec Emil |
| Migration DNS Wix → Vercel avec downtime | Moyen | Preparer le nouveau site en staging, tester tout avant le switch, prevoir le switch hors heures de pointe |
| Abonnements Stripe existants qui ne fonctionnent plus apres migration | Haut | Le compte Stripe reste le meme — seul le frontend change. Tester avec des abonnes de test avant go-live |
| Bande passante Supabase Storage insuffisante si le trafic augmente | Bas | 35 abonnes et 306 morceaux = volume negligeable. Monitorer et migrer vers R2 en Phase 2 si necessaire |
| Contenu blog difficile a extraire de Wix (formatage, images) | ~~Moyen~~ Resolu | 38 articles extraits via API avec richContent. Reste a valider le rendu apres migration |
| Perte de positionnement SEO pendant la migration | Moyen | Redirections 301 exhaustives, soumission immediate du sitemap, monitoring Google Search Console |

### Questions ouvertes

**Resolues :**
- [x] ~~Definir le contenu exact des CGV et CGU~~ → Contenu existant conserve tel quel (Phase 1)
- [x] ~~Definir les textes anglais pour la version EN~~ → Traduction par Claude Code
- [x] ~~Acces admin Wix pour l'export des donnees~~ → API Key Wix configuree, blog (38 articles) et contacts (1 254) extraits, membres (36) exportes en CSV

**En attente :**
- [x] ~~Confirmer les fonts exactes du site actuel~~ → Poppins (Google Font), identifiee via screenshots (~90% confiance, a confirmer via DevTools)
- [ ] Recevoir le catalogue musical : liste des 306 morceaux avec metadonnees (titre, artiste, style, theme, humeur, duree) — en attente de l'associe
- [ ] Recevoir les fichiers audio sources (306 morceaux) — en attente de l'associe
- [x] ~~Confirmer les categories de blog~~ → 4 categories validees : Guides, YouTube & Createurs, Cas d'usage, Artistes & Coulisses (alignees sur le funnel de conversion)
- [x] ~~Valider le comportement du player sur mobile~~ → Mini bar 60px + player etendu au tap (pattern Epidemic Sound/Artlist). CTA dore a la fin de l'extrait 30s.

---

## 8. Acceptance Criteria Globaux

> Consolidation de tous les criteres verifiables. Chaque critere est binaire (oui/non).

### Pages et Navigation
- [ ] Toutes les pages listees en section 4 sont accessibles en FR et EN
- [ ] Le header affiche le logo, la navigation principale et le selecteur de langue
- [ ] Le footer affiche les liens legaux (mentions, confidentialite, CGV, CGU), le formulaire newsletter et les liens sociaux
- [ ] La navigation fonctionne sans rechargement complet de la page (client-side routing)
- [ ] Le site est responsive et fonctionnel sur mobile (iPhone SE comme reference minimale)

### Catalogue et Player
- [ ] La page catalogue affiche tous les morceaux avec pagination (20 par page)
- [ ] Les filtres style/theme/humeur sont combinables et mettent a jour l'URL
- [ ] Le player persistant reste en bas de page pendant toute la navigation
- [ ] Un non-abonne entend un extrait de 30 secondes puis voit un CTA d'abonnement
- [ ] Un abonne entend le morceau complet et peut le telecharger

### Authentification et Abonnement
- [ ] L'inscription email/mot de passe fonctionne avec confirmation par email
- [ ] L'inscription Google OAuth fonctionne
- [ ] Stripe Checkout est fonctionnel pour les 3 plans (mensuel, annuel, boutique)
- [ ] Le webhook Stripe synchronise le statut d'abonnement dans Supabase en moins de 30 secondes
- [ ] Le Stripe Customer Portal est accessible depuis l'espace membre
- [ ] Les abonnes existants (migres depuis Wix) conservent leur tarif historique

### Espace Membre
- [ ] Le dashboard affiche le plan actif, la date de renouvellement et l'historique de telechargements
- [ ] Le champ Channel ID YouTube est fonctionnel et declenche une notification admin
- [ ] L'espace membre est inaccessible aux non-connectes (redirection vers login)

### Blog
- [ ] Les 38 articles sont migres et accessibles
- [ ] Chaque article a des meta tags SEO corrects
- [ ] Les categories sont filtrable

### SEO et Performance
- [ ] Score Lighthouse Performance > 90 sur la page d'accueil (desktop)
- [ ] Score Lighthouse SEO > 95 sur toutes les pages
- [ ] Toutes les redirections 301 du mapping sont fonctionnelles
- [ ] Le sitemap est genere et soumis a Google Search Console
- [ ] Les schema markup sont presents (Organization, Article, FAQPage)
- [ ] Les balises hreflang FR/EN sont presentes sur toutes les pages

### Securite
- [ ] Les fichiers audio complets ne sont pas accessibles sans abonnement actif (RLS + URL signee)
- [ ] Le webhook Stripe verifie la signature sur chaque requete
- [ ] Les inputs utilisateur sont valides par Zod cote serveur
- [ ] Les headers de securite sont configures (CSP, HSTS, X-Frame-Options)
- [ ] Le consentement cookies RGPD est fonctionnel

### Tracking
- [ ] PostHog capture les evenements du funnel de conversion
- [ ] Vercel Analytics est actif
- [ ] Le tracking ne s'active qu'apres consentement cookies

### Admin
- [ ] Le dashboard admin affiche les metriques cles (abonnes, revenus)
- [ ] Les notifications Channel ID YouTube sont visibles et marquables comme traitees
- [ ] Les routes admin sont inaccessibles aux non-admins

---

## 9. Donnees Collectees (Etat de la Migration)

> Donnees deja extraites et disponibles dans le dossier `data/` du projet.

### Extraites via API Wix
| Donnee | Fichier | Volume |
|--------|---------|--------|
| Articles de blog (metadonnees) | `data/blog/all_posts.json` | 38 articles |
| Articles de blog (contenu riche) | `data/blog/posts/*.json` | 38 fichiers |
| Resume blog | `data/blog/posts_summary.csv` | 38 lignes |

### Exportees manuellement depuis Wix
| Donnee | Fichier | Volume |
|--------|---------|--------|
| Membres | `data/members/contacts.csv` | 36 membres |

### Recuperees via API (non exportees)
| Donnee | Volume | Notes |
|--------|--------|-------|
| Contacts | 1 254 | Extractibles via Contacts API |
| Plans tarifaires | 5 plans | FR: mensuel 15,99 EUR, annuel 99,99 EUR, boutique 99,99 EUR / EN: mensuel 7,99 EUR, annuel 76 EUR |
| Structure du site | 37 pages | Via sitemap.xml |

### En attente
| Donnee | Bloqueur |
|--------|----------|
| Catalogue musical (306 morceaux + metadonnees) | En attente reponse de l'associe |
| Fichiers audio sources | En attente reponse de l'associe |
| ~~Fonts exactes du site~~ | Resolu : Poppins (a confirmer via DevTools) |

---

## 10. Analyse Technique Preliminaire

> Note : Cette section est informative. L'architecture detaillee sera definie avec `/plan-tech`.

### Stack validee (cf. brainstorm)

| Brique | Choix |
|--------|-------|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript |
| Hebergement | Vercel (plan gratuit) |
| Base de donnees | Supabase PostgreSQL (plan gratuit) |
| ORM | Drizzle |
| Auth | Supabase Auth |
| Paiement | Stripe (Checkout + Billing + Portal) |
| Storage audio | Supabase Storage |
| i18n | next-intl |
| Styling | Tailwind CSS + shadcn/ui |
| Recherche | Supabase Full-Text Search |
| Analytics | PostHog + Vercel Analytics |
| Validation | Zod |
| Newsletter | MailerLite (API) |

### Composants cles a creer

- **AudioPlayer** : Composant player persistant (context React pour l'etat global)
- **TrackCard** : Carte morceau reutilisable (grille catalogue)
- **FilterBar** : Barre de filtres combinables (style/theme/humeur)
- **PricingToggle** : Toggle mensuel/annuel avec animation
- **AuthForms** : Formulaires login/signup/reset
- **MemberDashboard** : Dashboard espace membre
- **AdminDashboard** : Dashboard admin minimal
- **NewsletterForm** : Formulaire d'inscription MailerLite
- **CookieConsent** : Banner consentement RGPD
- **LanguageSwitcher** : Selecteur FR/EN

### Points d'attention techniques

- **Player persistant** : Necessite un layout root avec le player hors du contenu de page pour eviter le re-render a chaque navigation. Utiliser un React Context ou un store (Zustand) pour l'etat audio.
- **URLs signees Supabase** : Les URLs de telechargement doivent etre generees cote serveur (Server Action ou API route) avec verification du statut d'abonnement.
- **Webhooks Stripe** : La route API ne doit pas utiliser le body parser par defaut de Next.js (raw body necessaire pour la verification de signature).
- **SEO et redirections** : Le fichier `next.config.js` devra contenir le mapping complet des redirections 301. Prevoir un middleware pour les redirections plus complexes.
- **i18n et slugs** : Les slugs de morceaux et articles restent en francais meme en version anglaise. Seuls les segments de route structurels sont traduits (ex: `/en/catalog/` vs `/fr/catalogue/`).
