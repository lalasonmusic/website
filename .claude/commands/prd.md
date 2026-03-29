# Générer une PRD à partir des Notes de Discovery

## Objectif
Transformer les notes de discovery en PRD structurée, en analysant la codebase existante pour assurer la cohérence.

## Règles Importantes
- **Analyser l'existant** avant de poser des questions (patterns, services, composants similaires).
- **Grouper les questions** : poser 3-5 questions d'un coup, pas une par une.
- **Respecter la langue** de l'input utilisateur (français ou anglais).
- **Ne PAS proposer d'implémentation technique** : c'est le rôle du mode Plan ensuite.
- **Intégrer les principes fondamentaux** dans les specs (voir section dédiée).
- **Acceptance Criteria binaires** : chaque critère doit être vérifiable par oui/non. Pas de formulations vagues ("bonne UX", "performant", "responsive"). Toujours spécifier le comportement attendu concrètement (ex: "Le tableau affiche 20 éléments par page" et non "Le tableau est paginé").

## Principes Fondamentaux à Intégrer
Ces principes doivent être considérés lors de la rédaction de la PRD :

### UX/UI
- Parcours utilisateur intuitif et fluide
- États de chargement, erreur, vide toujours gérés
- Responsive obligatoire (mobile-first)
- Feedback utilisateur sur chaque action
- Accessibilité (contraste, navigation clavier, aria-labels)

### SEO
- Structure des headings (h1 unique, hiérarchie h2/h3)
- Meta title et description optimisés
- Contenu important rendu côté serveur (SSR/SSG)
- URLs propres et canoniques
- Schema.org si pertinent

### Brand Kit
- Utiliser uniquement les variables de `@styles/globals.scss`
- Couleurs : `--text-*`, `--surface-*`, `--border-*`, `--semantic-*`
- Espacements : `--padding-*`, `--horizontal-spacing-*`, `--vertical-spacing-*`
- Typographie : `--text-heading-*`, `--text-body-*`, classes `.h1`-`.h6`, `.body-lg/md/sm/xs`
- Radius : `--radius-*`
- Shadows : `--shadow-*`
- Fonts : Rubik (headings/boutons), Manrope (body)

### Sécurité
- Validation des inputs utilisateur
- Authentification/autorisation si données sensibles
- Pas d'exposition de données personnelles
- Protection contre injections (XSS, NoSQL, prompt injection si LLM)

### Scalabilité
- Pagination si listes potentiellement longues
- Cache si données stables
- Lazy loading si contenu lourd
- Pas de requêtes bloquantes inutiles

## Étapes

### 1. **Demander les Informations de Base**
   - Demander le **nom de la feature** (sera utilisé pour le dossier).
   - Demander à l'utilisateur de **décrire la feature** ou **coller ses notes** (discovery, benchmark, décisions de meeting).

### 2. **Analyser la Codebase**
   Avant de poser des questions, explorer l'existant :
   - Rechercher des **composants/services similaires** à ce qui est demandé.
   - Identifier les **patterns récurrents** dans le code (structure, naming, conventions).
   - Repérer les **dépendances potentielles** (services, types, APIs existantes).
   - Noter les **éléments réutilisables** vs ce qui devra être créé.

   Afficher un résumé :
   ```
   ## Analyse de l'existant

   ### Composants/Services pertinents
   - [Composant X] : fait déjà Y, pourrait être réutilisé/étendu
   - [Service Z] : gère W, à considérer pour l'intégration

   ### Patterns identifiés
   - Structure : [pattern observé]
   - Conventions : [naming, organisation]

   ### Points d'attention
   - [Incohérence ou contrainte détectée]
   ```

### 3. **Poser des Questions de Clarification**
   Basé sur l'analyse, poser **3-5 questions groupées** pour clarifier :
   - Les zones floues des notes
   - Les choix produit non tranchés
   - Les edge cases non mentionnés
   - Les priorités si le scope semble large

   Format :
   ```
   ## Questions de clarification

   Avant de rédiger la PRD, j'ai besoin de clarifier quelques points :

   1. **[Question 1]** : [contexte de pourquoi c'est important]
   2. **[Question 2]** : [contexte]
   3. **[Question 3]** : [contexte]
   ```

   Attendre les réponses avant de continuer.

### 4. **Générer la PRD**
   Rédiger une PRD structurée avec les sections suivantes :

   ```markdown
   # PRD : [Nom de la Feature]

   **Date** : [YYYY-MM-DD]
   **Auteur** : [Nom si fourni]
   **Statut** : Draft / En review / Validée

   ---

   ## 1. Contexte et Problème

   ### Contexte
   [Pourquoi on fait ça ? Quel est le contexte business/produit ?]

   ### Problème
   [Quel problème utilisateur ou business on résout ?]

   ### Evidence
   [Données, feedback users, benchmark qui justifient ce besoin]

   ---

   ## 2. Objectif et Solution

   ### Objectif
   [Qu'est-ce qu'on veut accomplir ? Métriques de succès si pertinent]

   ### Solution proposée
   [Description de haut niveau de la solution]

   ### Ce que ce n'est PAS
   [Clarifier les malentendus potentiels sur le scope]

   ---

   ## 3. User Stories

   ### Story 1 : [Titre]
   **En tant que** [persona],
   **Je veux** [action],
   **Afin de** [bénéfice].

   **Critères d'acceptation :**
   - [ ] [Critère mesurable 1]
   - [ ] [Critère mesurable 2]

   ### Story 2 : [Titre]
   ...

   ---

   ## 4. Spécifications Fonctionnelles

   ### 4.1 [Fonctionnalité A]
   - **Comportement** : [Description détaillée]
   - **Règles métier** : [Règles à respecter]
   - **États** : [États possibles et transitions]

   ### 4.2 [Fonctionnalité B]
   ...

   ---

   ## 5. UX/UI

   ### Parcours utilisateur
   [Description du flow utilisateur]

   ### Maquettes / Références
   [Liens vers Figma, screenshots de référence, ou description des écrans]

   ### Interactions clés
   [Comportements d'interaction importants]

   ---

   ## 6. Hors Scope

   Les éléments suivants sont explicitement **hors scope** pour cette itération :
   - [Élément 1] : [raison]
   - [Élément 2] : [raison]

   ---

   ## 7. Risques et Questions Ouvertes

   ### Risques identifiés
   | Risque | Impact | Mitigation |
   |--------|--------|------------|
   | [Risque 1] | [Haut/Moyen/Bas] | [Action] |

   ### Questions ouvertes
   - [ ] [Question à trancher pendant le dev ou après]

   ---

   ## 8. Acceptance Criteria Globaux

   > Consolidation de tous les critères vérifiables de la feature. Chaque critère est binaire (oui/non). Cette section sera utilisée par `/task` pour scorer la conformité après implémentation.

   - [ ] [Critère 1 — comportement attendu précis]
   - [ ] [Critère 2 — comportement attendu précis]
   - [ ] ...

   ---

   ## 9. Analyse Technique Préliminaire

   > Note : Cette section est informative. L'architecture détaillée sera définie en mode Plan.

   ### Composants existants à réutiliser
   - [Composant/Service] : [comment il sera utilisé]

   ### Nouvelles créations probables
   - [Nouveau composant/service] : [pourquoi nécessaire]

   ### Points d'attention techniques
   - [Contrainte ou dépendance à considérer]
   ```

### 5. **Sauvegarder la PRD**
   - Créer le dossier : `/docs/specs/[YYYY-MM-feature-name]/`
   - Sauvegarder le fichier : `prd.md`
   - Afficher le chemin du fichier créé.

   Format du nom de dossier :
   - Date : année et mois (ex: `2026-01`)
   - Nom : en kebab-case (ex: `filtres-prix`, `auth-sso`)
   - Exemple complet : `2026-01-filtres-prix`

### 6. **Prochaines Étapes**
   Afficher les instructions pour la suite :
   ```
   ## Prochaines étapes

   1. **Review** : Valider cette PRD avec l'équipe
   2. **Mode Plan** : Une fois validée, ouvrir une nouvelle conversation en mode Plan :
      - Référencer la PRD : `@docs/specs/[feature]/prd.md`
      - Demander un plan technique avec choix d'architecture et alternatives
   3. **Build** : Après validation du plan technique
   ```

## Notes
- Si les notes sont trop vagues, demander plus de contexte avant de générer.
- Si le scope semble trop large, proposer de le découper en plusieurs PRDs.
- Ne pas inventer de fonctionnalités non mentionnées par l'utilisateur.
- Rester focalisé sur le "quoi" et "pourquoi", pas le "comment" technique.
