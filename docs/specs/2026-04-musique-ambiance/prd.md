# PRD : Section publique "Musique d'ambiance" pour prospects boutique

**Date** : 2026-04-25
**Auteur** : Emil van der Gijp
**Statut** : Draft

---

## 1. Contexte et Problème

### Contexte
Lalason vend deux formules d'abonnement très différentes :
- **Créateurs** (créateurs YouTube, podcasteurs, monteurs) : achètent l'accès au catalogue pour **télécharger** des morceaux à intégrer dans leurs contenus.
- **Boutique** (salons de coiffure, instituts de beauté, spas, cabinets dentaires/vétérinaires/psychologues, ostéopathes/kinés) : achètent l'accès pour **diffuser en streaming continu** des playlists d'ambiance dans leur établissement.

Le site actuel est conçu autour du parcours créateur : le `/catalogue` public expose les morceaux à l'unité, en streaming complet, avec gating uniquement sur le téléchargement.

### Problème
Pour un prospect boutique, le catalogue à l'unité ne représente PAS le produit qu'il va acheter. Le produit boutique = des **playlists curées par vertical métier** (ambiance cohérente, transitions douces, mood adapté à chaque type de lieu). Aujourd'hui :
- Aucune surface publique ne permet à un coiffeur de "tester" la playlist qu'il aurait s'il s'abonnait.
- Zero acquisition SEO sur les requêtes B2B des prospects boutique : "musique salon de coiffure libre de droits", "musique d'ambiance spa", "musique cabinet dentaire", etc.
- Conversion difficile : aucun argument tactile, juste une page tarifaire.

### Evidence
- Volume de recherche Google estimé élevé sur les mots-clés "musique [vertical métier] libre de droits" (plusieurs centaines à plusieurs milliers de recherches/mois selon le vertical).
- Concurrents directs (Epidemic Sound, Artlist, Soundstripe) exposent tous des playlists publiques avec preview limitée — pattern industriel validé.
- Catalogue actuel = 317 morceaux importés, suffisant pour alimenter 7 playlists thématiques (avec doublons assumés).

---

## 2. Objectif et Solution

### Objectif
1. **Acquisition SEO** (canal #1 visé) : ranker sur les requêtes B2B des prospects boutique via 7 landing pages optimisées par vertical.
2. **Conversion** : permettre au prospect de "ressentir" le produit avant achat, augmenter le taux de conversion sur la formule boutique.
3. **Anti-freeloader** : ne PAS permettre l'utilisation gratuite illimitée du catalogue boutique en streaming sur le site.

### Solution proposée
Créer une nouvelle section publique du site, accessible depuis le menu principal sous le label **"Musique d'ambiance"** (entre "Catalogue" et "Nos artistes"), qui expose 7 playlists boutique organisées par vertical métier.

**Architecture URLs (FR + EN dès le launch) :**
- Hub : `/fr/musique-ambiance` · `/en/ambient-music`
- Détail : `/fr/musique-ambiance/[slug]` · `/en/ambient-music/[slug]`

**Modèle de preview anti-freeloader :**
- 1 morceau "démo" par playlist : lecture en intégralité (le curateur sélectionne explicitement le meilleur titre représentatif).
- Tous les autres morceaux : lecture coupée à **30 secondes** côté client, avec CTA "S'abonner pour écouter en illimité".
- **Pas d'auto-chaînage** : le visiteur déclenche manuellement chaque morceau (modèle Epidemic Sound / Artlist), pas de "play playlist" qui enchaîne automatiquement.

**Modélisation DB :**
- Ajout d'un champ `audience` (enum `creator` / `boutique`, default `creator`) sur la table `playlists` pour distinguer les playlists boutique des playlists créateur existantes.
- Ajout d'un champ `is_demo` (boolean) sur la table `playlist_tracks` avec contrainte d'unicité partielle : maximum 1 morceau démo par playlist.

### Ce que ce n'est PAS
- Pas un nouveau player audio : on réutilise le `FloatingPlayer` existant, étendu avec la logique de coupure 30s.
- Pas une refonte de la page d'abonnement boutique (`/fr/abonnements`) : on pointe vers l'existant.
- Pas un outil IA in-app de remplissage des playlists : le remplissage initial est fait par Emil manuellement via l'admin existant après le déploiement.
- Pas d'admin pour créer de nouvelles playlists : l'outil admin existe déjà, on l'étend uniquement pour gérer le champ `audience` et le marquage `is_demo`.

---

## 3. User Stories

### Story 1 : Prospect boutique découvre la section via Google
**En tant que** gérant·e d'un salon de coiffure cherchant "musique salon coiffure libre de droits" sur Google,
**Je veux** atterrir sur une page dédiée au salon de coiffure avec un échantillon audio représentatif,
**Afin de** comprendre en moins de 60 secondes si l'ambiance Lalason correspond à mon lieu.

**Critères d'acceptation :**
- [ ] La page `/fr/musique-ambiance/salon-coiffure` retourne 200 et est rendue côté serveur (SSR/SSG).
- [ ] La page contient un h1 unique correspondant au nom de la playlist.
- [ ] La page contient un meta title et meta description spécifiques au vertical, contenant le mot-clé principal.
- [ ] La page est indexable (pas de `noindex`) et a une URL canonique correcte.
- [ ] Au moins 1 morceau démo est jouable en intégralité depuis cette page si la playlist en contient (dans le cas où Emil l'a déjà rempli ; à vide, voir Story 5).

### Story 2 : Prospect boutique navigue depuis le menu
**En tant que** visiteur du site Lalason,
**Je veux** pouvoir cliquer sur "Musique d'ambiance" dans le menu principal,
**Afin de** voir la liste des 7 playlists boutique disponibles et choisir celle qui me concerne.

**Critères d'acceptation :**
- [ ] Le menu desktop affiche 5 entrées dans cet ordre : Catalogue · Musique d'ambiance · Nos artistes · Blog · Abonnements.
- [ ] Le menu mobile contient les mêmes 5 entrées dans le même ordre.
- [ ] Le clic sur "Musique d'ambiance" mène à `/fr/musique-ambiance` (ou `/en/ambient-music` selon la locale).
- [ ] La page hub liste les 7 playlists boutique (carte avec nom, description courte, gradient, emoji, nombre de morceaux).
- [ ] Le clic sur une carte de playlist mène à la page détail correspondante.
- [ ] Les playlists créateur (existantes) ne sont PAS affichées sur cette page hub.

### Story 3 : Prospect boutique écoute des extraits sur une page playlist
**En tant que** prospect boutique consultant la page d'une playlist,
**Je veux** pouvoir cliquer sur n'importe quel morceau pour l'écouter,
**Afin de** me faire une idée de la qualité et de la cohérence sonore.

**Critères d'acceptation :**
- [ ] Le morceau marqué `is_demo` joue en intégralité jusqu'à sa fin naturelle.
- [ ] Tous les autres morceaux de la playlist se coupent automatiquement à 30 secondes pile (±0.5s) avec un événement visuel (ex: notification "Extrait limité à 30s — abonnez-vous").
- [ ] Un visiteur connecté avec abo Créateur uniquement subit la même coupure 30s (traité comme non-abonné côté boutique, cf. Story 4).
- [ ] Un visiteur connecté avec abo Boutique actif n'a AUCUNE coupure : tous les morceaux jouent en intégralité.
- [ ] Le lecteur affiche le nom du morceau, l'artiste, la durée, et l'état "démo full" ou "extrait 30s".
- [ ] Le démarrage d'un morceau ne déclenche PAS l'auto-chaînage : à la fin du morceau (ou de l'extrait 30s), la lecture s'arrête.

### Story 4 : Prospect non-abonné est incité à souscrire
**En tant que** prospect boutique convaincu par les extraits,
**Je veux** pouvoir m'abonner en 1 clic depuis la page playlist,
**Afin de** débloquer l'accès complet sans friction.

**Critères d'acceptation :**
- [ ] Un CTA "S'abonner à la formule Boutique" est présent visiblement en haut de chaque page playlist (au-dessus du fold sur desktop).
- [ ] Un second CTA est présent en pied de page playlist.
- [ ] Le CTA pointe vers `/fr/abonnements#boutique` (ou équivalent EN), pas vers Stripe directement (l'utilisateur doit voir le tarif avant le checkout).
- [ ] Lors de la coupure à 30s d'un morceau non-démo, un message contextuel apparaît avec un CTA secondaire "S'abonner pour écouter en illimité" cliquable.

### Story 5 : Admin (Emil) gère le marquage des playlists boutique
**En tant qu'**administrateur Lalason,
**Je veux** pouvoir marquer une playlist comme "boutique" et désigner son morceau démo,
**Afin de** contrôler ce qui s'affiche dans la nouvelle section publique.

**Critères d'acceptation :**
- [ ] La page admin d'édition d'une playlist (`/admin/playlists/[id]`) propose un sélecteur "Audience" avec deux options : "Créateurs" / "Boutique".
- [ ] La même page propose, pour chaque morceau de la playlist, une case à cocher "Morceau démo (lecture full publique)".
- [ ] Cocher la case "démo" sur un morceau décoche automatiquement la case sur les autres morceaux de la même playlist (un seul démo possible).
- [ ] Une playlist sans morceau démo est sauvegardable mais affiche un avertissement visuel dans l'admin si elle est marquée `boutique`.
- [ ] Au déploiement, les 7 playlists boutique existent en DB (slug, name FR/EN, description FR/EN, gradient, emoji, audience=boutique) **mais peuvent contenir 0 morceaux** ; Emil les remplit manuellement après le déploiement.

### Story 6 : Popup d'incitation à l'abonnement après 15 secondes
**En tant que** prospect boutique non-abonné consultant une page de la section Musique d'ambiance,
**Je veux** être incité à m'abonner via un popup contextuel après quelques secondes de navigation,
**Afin de** ne pas rater l'offre Boutique si je ne scrolle pas jusqu'aux CTAs.

**Critères d'acceptation :**
- [ ] Un popup modal apparaît automatiquement 15 secondes après l'arrivée sur n'importe quelle page de la section "Musique d'ambiance" (hub ou détail).
- [ ] Le popup affiche la formule **Boutique Annuel à 99,99 €/an** (1 seule carte, pas 2 comme le popup créateur du catalogue) avec ses bénéfices clés (3-5 features).
- [ ] Le popup contient un bouton "S'abonner" qui mène à `/fr/abonnements#boutique` (ou EN équivalent).
- [ ] Le popup contient un bouton "Fermer" (croix) et est aussi fermable en cliquant sur le backdrop.
- [ ] Une fois fermé, le popup ne réapparaît PAS pendant la même session de navigation (persistance via `sessionStorage` avec une clé dédiée `boutique-popup-dismissed` distincte de la clé du popup créateur `sub-popup-dismissed`).
- [ ] Le popup ne s'affiche PAS pour les utilisateurs avec un abonnement Boutique actif (déjà clients).
- [ ] Le popup s'affiche pour : visiteurs non-connectés, utilisateurs connectés sans abo, utilisateurs connectés avec abo Créateur uniquement.
- [ ] Le popup est traduit en EN avec les mêmes règles d'affichage.

### Story 7 : Visiteur EN (anglais) accède à la même expérience
**En tant que** visiteur anglophone,
**Je veux** retrouver la section "Musique d'ambiance" dans ma langue,
**Afin de** comprendre le produit et naviguer naturellement.

**Critères d'acceptation :**
- [ ] Le menu en locale `en` affiche l'entrée "Ambient Music" (ou équivalent traduit) à la position définie.
- [ ] Les routes `/en/ambient-music` et `/en/ambient-music/[slug]` existent et retournent 200.
- [ ] Le slug FR `salon-coiffure` a un équivalent EN sémantique (ex: `hair-salon`) pour optimiser le SEO anglophone.
- [ ] Tous les libellés statiques (boutons, labels, CTA, messages) sont traduits en EN dans `messages/en.json`.
- [ ] Les noms de playlist (`nameEn`) et descriptions (`descriptionEn`) sont saisis pour les 7 playlists au déploiement.

---

## 4. Spécifications Fonctionnelles

### 4.1 Champ `audience` sur la table `playlists`
- **Comportement** : nouvel enum DB `playlist_audience` avec valeurs `creator` et `boutique`. Toute nouvelle playlist a `audience = creator` par défaut. Les 7 playlists boutique seront créées avec `audience = boutique` via une migration de seeding.
- **Règles métier** :
  - L'API publique `/api/playlists/boutique` (ou query param `?audience=boutique`) ne retourne que les playlists `audience = boutique` ET `isPublished = true`.
  - L'API existante `/api/playlists` (utilisée dans l'espace membre) reste rétrocompatible : pas de filtre par défaut → renvoie toutes les playlists publiées.
- **États** : `creator` (par défaut) | `boutique`.

### 4.2 Champ `is_demo` sur la table `playlist_tracks`
- **Comportement** : nouveau booléen sur le join `playlist_tracks`. Marque un seul morceau par playlist comme "démo" (jouable en full sur la section publique).
- **Règles métier** :
  - Contrainte DB : index unique partiel `WHERE is_demo = true` sur `(playlist_id)` → empêche d'avoir 2 démos pour la même playlist au niveau DB.
  - Côté admin : cocher "démo" sur un morceau X décoche automatiquement le morceau Y précédemment démo (logique dans la mutation API).
  - Pas de contrainte "obligatoire" : une playlist boutique peut exister sans démo (mais sera affichée avec un avertissement admin et n'aura aucun morceau jouable en full sur la page publique).
- **États** : `true` (1 max par playlist) | `false`.

### 4.3 Coupure 30s côté lecteur audio
- **Comportement** : quand un morceau est joué dans le contexte d'une playlist boutique ET que l'utilisateur n'est pas abonné boutique ET que le morceau n'est pas marqué `is_demo`, le lecteur stoppe la lecture à 30 secondes.
- **Règles métier** :
  - Le store Zustand du player reçoit un flag `isPreviewLimited` (booléen) et une durée limite `previewDurationSec` (number, default 30).
  - Quand `currentTime >= previewDurationSec`, la lecture est mise en pause, le morceau est marqué comme "preview ended", et un état UI déclenche l'affichage du CTA d'upgrade.
  - Le timer est purement client-side (HTML5 `audio` element + listener `timeupdate`).
  - Aucune modification du fichier audio sur Storage : on continue à servir le `previewPath` actuel (MP3 complet en bucket public).
- **États** : `playing-full` | `playing-preview` | `preview-ended` | `paused` | `stopped`.

### 4.4 Pages publiques (hub + détail)
- **Hub `/fr/musique-ambiance`** :
  - Liste les 7 playlists boutique sous forme de cartes (gradient, emoji, nom, description courte, nombre de morceaux).
  - Clic carte → navigation vers la page détail.
  - Inclut un bloc d'introduction expliquant la formule boutique (1-2 paragraphes SEO).
  - CTA "Voir l'abonnement Boutique" pointant vers `/fr/abonnements#boutique`.

- **Détail `/fr/musique-ambiance/[slug]`** :
  - Header avec nom de la playlist, description longue, gradient en bandeau, emoji.
  - Liste des morceaux : titre, artiste, durée, bouton play, badge "Démo full" sur le morceau démo.
  - Lecteur intégré (réutilise le `FloatingPlayer`) avec coupure 30s active.
  - Bloc CTA d'abonnement en haut et en bas.
  - Bloc "Autres playlists boutique" (3 cartes max) en bas pour cross-navigation interne (bon pour SEO et engagement).

### 4.5 Routes localisées (FR + EN)
- next-intl gère les pathnames localisés. Le slug interne reste stable en DB (`salon-coiffure`), et next-intl mappe vers le slug localisé dans l'URL (ex: `hair-salon` en EN).
- Mapping FR ↔ EN à définir dans la config next-intl :

  | FR | EN |
  |---|---|
  | `salon-coiffure` | `hair-salon` |
  | `institut-beaute` | `beauty-salon` |
  | `spa-massage` | `spa-massage` |
  | `cabinet-veterinaire` | `veterinary-clinic` |
  | `cabinet-dentaire` | `dental-clinic` |
  | `osteopathe-kine` | `osteopath-physio` |
  | `cabinet-psychologue` | `therapist-office` |

- Les slugs EN sont indicatifs ; à valider en plan technique selon les contraintes de next-intl.

### 4.6 Popup d'incitation à l'abonnement (BoutiqueSubscriptionPopup)
- **Comportement** : composant client rendu sur le hub ET les pages détail. Au montage, démarre un `setTimeout` de **15 000 ms**. À l'expiration, le popup s'affiche par-dessus le contenu (modal centrée + backdrop blur), sauf si :
  - L'utilisateur a déjà fermé le popup pendant cette session (`sessionStorage.getItem("boutique-popup-dismissed") === "1"`), OU
  - L'utilisateur est abonné Boutique actif (le composant reçoit cette info via prop server-side, pas de fetch côté client).
- **Contenu** :
  - Titre : "Diffusez Lalason dans votre établissement" (FR) / "Stream Lalason in your venue" (EN).
  - 1 carte plan Boutique : prix 99,99 €/an, badge "Sans engagement annuel", bouton "S'abonner" vers `/fr/abonnements#boutique`.
  - Liste 3-5 bénéfices (ex: "Catalogue complet sans coupure", "Licence diffusion publique incluse", "Pas de droits SACEM à payer", "Support email prioritaire").
- **Règles métier** :
  - Délai = 15s (vs 10s pour le popup créateur, pour laisser plus de temps de découverte sur les pages playlist).
  - Clé `sessionStorage` distincte (`boutique-popup-dismissed`) : ne pas réutiliser celle du popup créateur catalogue (`sub-popup-dismissed`), sinon un visiteur qui ferme l'un n'a plus l'autre.
  - Si l'utilisateur navigue entre plusieurs pages de la section, le popup ne s'affiche qu'une fois par session (la clé sessionStorage est posée dès qu'il s'affiche, même sans clic de fermeture).
- **États** : `hidden` (avant 15s) | `visible` | `dismissed`.

### 4.7 Gating utilisateur
| Type d'utilisateur | Comportement sur page playlist boutique |
|---|---|
| Visiteur non-connecté | Démo full + autres morceaux coupés à 30s + CTA abo |
| Connecté sans abo | Démo full + autres morceaux coupés à 30s + CTA abo |
| Connecté abo Créateur (uniquement) | Démo full + autres morceaux coupés à 30s + CTA upgrade boutique |
| Connecté abo Boutique actif | Tous les morceaux en intégralité, pas de CTA, pas de coupure |
| Connecté abo Créateur + Boutique | Idem abo Boutique |

---

## 5. UX/UI

### Parcours utilisateur cible (prospect boutique via Google)
1. Le coiffeur tape "musique salon coiffure libre de droits" sur Google.
2. Atterrit sur `/fr/musique-ambiance/salon-coiffure` (rang Google espéré : 1-3 sur le long terme).
3. Voit la promesse claire en h1, lit la description, voit la liste des morceaux.
4. Clique sur le morceau démo (mis en avant visuellement avec badge "Démo") → écoute 2-3 minutes complètes.
5. Si convaincu, clique sur 2-3 autres titres → coupure à 30s avec CTA "S'abonner pour écouter en illimité".
6. Clique le CTA → atterrit sur `/fr/abonnements#boutique` → souscrit.

### Parcours alternatif (visiteur direct depuis menu)
1. Visiteur arrive sur la home, voit "Musique d'ambiance" dans le menu.
2. Clique → page hub avec les 7 cartes playlists.
3. Identifie son métier (ou le plus proche), clique → page détail.
4. Mêmes étapes 4-6 que le parcours Google.

### Maquettes / Références
- **Inspirations directes** : Epidemic Sound (sections par usage), Artlist (collections curées), Soundstripe (verticales B2B).
- **Pas de Figma à ce stade** : les maquettes seront produites en mode `/plan-tech` ou délégué.
- **Cohérence visuelle** : réutiliser les composants existants (cartes playlists du carousel membre, FloatingPlayer, gradient/emoji, palette Brand Kit).

### Interactions clés
- **Clic carte playlist** : navigation full-page (pas de modale).
- **Clic morceau** : lecture immédiate dans le `FloatingPlayer`, pas de page intermédiaire.
- **Coupure 30s** : transition douce (fade-out 300ms), pas de coupure brutale ; affichage d'un toast/notification persistante avec CTA.
- **Hover sur morceau démo** : badge "Démo écoute complète" visible.
- **Mobile** : layout responsive ; lecteur reste accessible (sticky bottom).

### États à gérer
- **Loading** : skeleton sur les cartes playlist (page hub) et sur la liste de morceaux (page détail).
- **Vide** : si une playlist boutique n'a aucun morceau (cas du déploiement initial), afficher un message "Playlist en cours de curation — revenez bientôt" + lister les autres playlists.
- **Erreur** : 404 propre si slug inexistant, 500 propre si l'API plante.
- **Aucun morceau démo** : si une playlist a 0 morceau marqué `is_demo`, tous les morceaux sont en mode 30s coupé pour les non-abonnés (pas de full).

### Accessibilité
- Boutons play avec `aria-label` explicite ("Écouter [titre] de [artiste]").
- Contraste textuel WCAG AA minimum sur les gradients (cartes).
- Navigation clavier : tab order logique sur la liste de morceaux, Enter pour jouer.
- Le toast "extrait limité" est annoncé via `aria-live="polite"`.

---

## 6. Hors Scope

| Élément | Raison |
|---|---|
| Création de nouvelles playlists par l'admin | L'outil admin existe déjà, pas de modification CRUD nécessaire au-delà de l'ajout des champs `audience` et `is_demo`. |
| Refonte de la page d'abo boutique (`/fr/abonnements`) | La page existe et fonctionne. Le CTA pointe simplement dessus. |
| Bouton admin "Remplir cette playlist via IA" | Hors scope (Q5b décision). Emil remplit manuellement les 7 playlists après déploiement. Si besoin futur, feature séparée. |
| Génération de fichiers audio 30s côté serveur | Décision technique : coupure côté client (timer JS), pas de duplication des 300+ fichiers. |
| Tracking analytics avancé (funnel playlist → abo) | À traiter dans une feature analytics dédiée (cf. spec dashboard métriques SaaS en cours). |
| Cross-promotion playlists créateur ↔ boutique | Pas dans cette v1. La section publique reste 100% focalisée boutique. |
| Sharing social (open graph par playlist, partage Twitter/Facebook) | Souhaitable mais non bloquant pour le launch. À considérer en v1.1. |
| Mode "playlist auto-play continue" pour démo | Volontairement exclu : l'auto-play donnerait l'expérience complète gratuitement. Lecture manuelle track-par-track imposée. |

---

## 7. Risques et Questions Ouvertes

### Risques identifiés
| Risque | Impact | Mitigation |
|---|---|---|
| Coupure 30s côté client contournable via devtools | Bas | Threat model = prospects boutique, pas pirates. Si bypass devient massif, on passe à un fichier 30s côté serveur (réversible). |
| Doublons massifs de morceaux entre les 7 playlists boutique | Moyen | Accepté en notes. Curation manuelle d'Emil après déploiement résout au cas par cas. |
| SEO : Google peut considérer les 7 pages comme "duplicate content" si descriptions/morceaux trop similaires | Moyen | Descriptions uniques par vertical (Emil rédige en EN+FR), morceaux différents grâce à la curation, schema.org `MusicPlaylist` distinct. |
| Slugs EN à choisir (pas de référence interne actuelle) | Bas | Mapping proposé en §4.5, à valider en plan technique avec next-intl. |
| Performance de la page détail si playlist contient >50 morceaux | Bas | Pagination ou lazy-load à prévoir si dépassé. v1 : pas de pagination (les playlists boutique typiques font 30-80 morceaux). |
| Conflit avec la table `playlists` actuelle (utilisée par espace membre créateur) | Bas | Champ `audience` avec default `creator` = rétrocompatible. Aucune playlist existante n'est impactée. |

### Questions ouvertes
- [ ] Faut-il un avertissement explicite sur la page playlist : "Les abonnés Créateurs n'ont pas accès au streaming complet de ces playlists" pour éviter la confusion ? À trancher au design.
- [ ] La page hub doit-elle inclure un témoignage client / preuve sociale (ex: "Plus de X salons de coiffure utilisent Lalason") ? Pas de data dispo aujourd'hui, à reporter en v1.1.
- [ ] Doit-on tracker un événement PostHog spécifique "playlist_boutique_play" et "playlist_boutique_preview_ended" pour mesurer la conversion ? À valider en plan technique (probablement oui, faible coût).
- [ ] Les 7 playlists doivent-elles être mises en avant sur la home (`/fr`) ou uniquement accessibles via le menu/SEO ? À trancher après le launch (mesure d'impact).

---

## 8. Acceptance Criteria Globaux

> Consolidation de tous les critères vérifiables. Chaque critère est binaire (oui/non).

**Navigation et menu**
- [ ] Le menu desktop affiche 5 entrées dans cet ordre : Catalogue · Musique d'ambiance · Nos artistes · Blog · Abonnements.
- [ ] Le menu mobile affiche les mêmes 5 entrées dans le même ordre.
- [ ] L'entrée "Musique d'ambiance" est traduite en "Ambient Music" en locale `en`.

**Pages publiques**
- [ ] La page `/fr/musique-ambiance` retourne 200 et liste exactement 7 cartes playlists.
- [ ] La page `/en/ambient-music` retourne 200 et liste les mêmes 7 playlists avec libellés EN.
- [ ] Les pages `/fr/musique-ambiance/[slug]` retournent 200 pour les 7 slugs FR définis et 404 pour tout autre slug.
- [ ] Les pages `/en/ambient-music/[slug]` retournent 200 pour les 7 slugs EN définis.
- [ ] Chaque page playlist a un h1 unique correspondant au nom de la playlist.
- [ ] Chaque page playlist a un meta title et meta description spécifiques contenant le mot-clé principal du vertical.
- [ ] Les pages sont rendues côté serveur (SSR ou SSG).
- [ ] Les pages ont une URL canonique correctement déclarée.
- [ ] Les pages incluent un schema.org `MusicPlaylist` (JSON-LD).
- [ ] Les pages playlist sans morceau affichent un état vide explicite.

**Lecteur audio et gating**
- [ ] Le morceau marqué `is_demo` joue en intégralité jusqu'à sa fin naturelle pour tous les utilisateurs.
- [ ] Tous les autres morceaux d'une playlist boutique stoppent à 30 secondes ±0.5s pour visiteurs non-connectés et abonnés Créateur.
- [ ] Les abonnés Boutique actifs n'ont aucune coupure sur les morceaux.
- [ ] Aucun auto-chaînage de morceaux : à la fin d'un morceau ou d'un extrait 30s, la lecture s'arrête.
- [ ] La coupure à 30s déclenche l'affichage d'un message contextuel avec CTA "S'abonner pour écouter en illimité".

**CTAs et conversion**
- [ ] Un CTA "S'abonner à la formule Boutique" est présent au-dessus du fold sur chaque page playlist (desktop).
- [ ] Un second CTA est présent en bas de chaque page playlist.
- [ ] Tous les CTAs principaux pointent vers `/fr/abonnements#boutique` (ou EN équivalent).

**Popup d'incitation**
- [ ] Un popup modal apparaît 15 secondes après l'arrivée sur le hub ou une page détail de la section Musique d'ambiance.
- [ ] Le popup affiche la formule Boutique Annuel à 99,99 €/an (1 seule carte) avec 3-5 bénéfices.
- [ ] Le popup contient un bouton de fermeture (croix) ET est fermable via clic sur le backdrop.
- [ ] Le popup n'apparaît plus pendant la même session après fermeture (clé `sessionStorage` `boutique-popup-dismissed`).
- [ ] La clé `sessionStorage` est distincte de celle du popup créateur catalogue (`sub-popup-dismissed`).
- [ ] Le popup ne s'affiche jamais aux utilisateurs avec abonnement Boutique actif.
- [ ] Le popup s'affiche aux visiteurs non-connectés, aux connectés sans abo, et aux connectés abonnés Créateur uniquement.
- [ ] Le popup est traduit en EN.

**Admin**
- [ ] La page admin `/admin/playlists/[id]` propose un sélecteur "Audience" avec deux options : Créateurs / Boutique.
- [ ] La page admin propose une case "Morceau démo" sur chaque morceau de la playlist.
- [ ] Cocher "démo" sur un morceau décoche automatiquement les autres dans la même playlist.
- [ ] Une playlist boutique sans morceau démo affiche un avertissement visuel dans l'admin.

**Données initiales (déploiement)**
- [ ] Une migration crée 7 playlists en DB avec : slug FR, slug EN, nameFr, nameEn, descriptionFr, descriptionEn, gradient, emoji, audience=boutique, isPublished=true, displayOrder.
- [ ] Les 7 playlists peuvent contenir 0 morceaux au déploiement (Emil remplit manuellement après).

**i18n**
- [ ] Tous les libellés statiques de la nouvelle section sont traduits en FR et EN dans `messages/fr.json` et `messages/en.json`.
- [ ] Les 7 playlists ont des `nameFr` + `nameEn` + `descriptionFr` + `descriptionEn` saisis au déploiement.

**Responsive et accessibilité**
- [ ] Toutes les pages sont utilisables en mobile (largeurs ≥ 360px) sans scroll horizontal.
- [ ] Les boutons play ont un `aria-label` explicite.
- [ ] Le contraste textuel respecte WCAG AA sur les cartes à gradient.
- [ ] Le toast "extrait limité" est annoncé via `aria-live="polite"`.
- [ ] La navigation clavier permet de jouer un morceau (tab + Enter).

---

## 9. Analyse Technique Préliminaire

> Note : Cette section est informative. L'architecture détaillée sera définie en mode `/plan-tech`.

### Composants existants à réutiliser
- **Schéma DB `playlists` + `playlist_tracks`** (`src/db/schema/playlists.ts`) : utilisé tel quel, avec ajout de 2 champs.
- **API admin playlists** (`src/app/api/admin/playlists/**`) : utilisée telle quelle, étendue pour gérer `audience` et `is_demo`.
- **API publique `/api/playlists`** (`src/app/api/playlists/route.ts`) : à étendre pour filtrer par `audience` ou créer un endpoint dédié `/api/playlists/boutique`.
- **`FloatingPlayer` + Zustand `playerStore`** (`src/components/player/`, `src/store/playerStore.ts`) : étendu avec un flag `isPreviewLimited` et logique de coupure.
- **`PlaylistEditor`** (`src/components/admin/PlaylistEditor.tsx`) : étendu avec sélecteur audience + checkbox demo par track.
- **`Header` + `MobileMenu`** (`src/components/layout/`) : ajout d'1 entrée dans `navLinks`.
- **System de gating abo** (middleware + lookup `subscriptions.planType`) : utilisé tel quel pour identifier abonnés boutique.

### Nouvelles créations probables
- **Pages publiques** : `src/app/[locale]/musique-ambiance/page.tsx` (hub) + `src/app/[locale]/musique-ambiance/[slug]/page.tsx` (détail). Note : next-intl gérera le mapping FR/EN.
- **Composant `BoutiquePlaylistCard`** : carte de playlist boutique pour le hub (peut être un fork léger du carrousel membre).
- **Composant `BoutiqueTrackList`** : liste de morceaux avec badge démo + play.
- **Composant `BoutiqueSubscriptionPopup`** : popup d'incitation (15s, 1 carte plan Boutique 99,99 €/an, sessionStorage). Forké du `SubscriptionPopup` catalogue (`src/components/catalogue/SubscriptionPopup.tsx`) avec adaptations : 1 plan au lieu de 2, clé sessionStorage distincte, gating par type d'abo.
- **Migration DB** : ajout colonnes `audience` (enum) et `is_demo` (boolean), seed des 7 playlists.
- **Endpoint API ou paramètre** : `/api/playlists?audience=boutique` ou route dédiée.
- **Clés i18n** : `nav.ambient`, `boutique.playlist.preview_ended`, `boutique.playlist.cta_subscribe`, etc.

### Points d'attention techniques
- **next-intl pathnames localisés** : la config `pathnames` de next-intl doit mapper les slugs FR ↔ EN. À vérifier que la version installée supporte les pathnames dynamiques (`[slug]`).
- **Index unique partiel sur `playlist_tracks.is_demo`** : Postgres supporte `CREATE UNIQUE INDEX ... WHERE is_demo = true`. Drizzle peut nécessiter du SQL brut dans la migration.
- **Cache** : les pages publiques bénéficieraient d'un ISR (revalidate 60s ou plus) pour SEO + perfs. À confirmer en plan technique.
- **Schema.org `MusicPlaylist`** : structure JSON-LD à intégrer côté SSR pour l'enrichissement Google.
- **Compteur `trackCount` sur la page hub** : déjà calculé dans l'API publique existante (`tracks.length`). À vérifier les perfs si ça scale (probablement OK avec 7 playlists × 50 morceaux).

---

## Prochaines étapes

1. **Review** : valider cette PRD avec Emil et toute personne impliquée.
2. **Mode `/plan-tech`** : une fois validée, ouvrir une nouvelle conversation et référencer `@docs/specs/2026-04-musique-ambiance/prd.md` pour générer le plan technique (décisions d'archi, alternatives, breakdown en tâches avec checkboxes).
3. **Build** : `/task` après validation du plan technique.
