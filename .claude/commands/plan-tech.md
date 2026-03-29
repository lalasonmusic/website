# Générer un Plan Technique à partir d'une PRD

## Objectif
Transformer une PRD validée en plan technique détaillé avec choix d'architecture, alternatives considérées, et décomposition en tâches.

## Prérequis
- Une PRD validée existe dans `/docs/specs/[feature]/prd.md`

## Règles Importantes
- **Analyser la PRD en profondeur** avant de proposer des solutions.
- **Explorer la codebase** pour identifier les patterns et contraintes existantes.
- **Proposer des alternatives** avec avantages/inconvénients pour les décisions importantes.
- **Quantifier l'impact** sur l'existant (fichiers à modifier, risques de régression).
- **Respecter la langue** de la PRD.
- **Valider le respect des principes fondamentaux** (voir section dédiée).

## Principes Fondamentaux à Valider
Chaque décision technique doit respecter ces principes :

### UX/UI
- Responsive mobile-first (breakpoints cohérents)
- États : loading, error, empty, success toujours gérés
- Animations/transitions fluides (pas de jank)
- Feedback immédiat sur les actions utilisateur

### SEO
- Contenu critique en SSR/SSG (pas de fetch client-only pour le SEO)
- Meta tags dynamiques côté serveur
- Structure sémantique HTML (headings, landmarks)
- Performance (Core Web Vitals)

### Brand Kit - `@styles/globals.scss`
Toujours utiliser les variables CSS, jamais de valeurs en dur :
- **Couleurs** : `var(--text-*)`, `var(--surface-*)`, `var(--border-*)`, `var(--semantic-*)`
- **Espacements** : `var(--padding-*)`, `var(--horizontal-spacing-*)`, `var(--vertical-spacing-*)`
- **Typographie** : `var(--text-heading-*)`, `var(--text-body-*)` ou classes `.h1`-`.h6`, `.body-*`
- **Radius** : `var(--radius-*)`
- **Shadows** : `var(--shadow-*)`
- **Fonts** : Rubik pour headings/boutons, Manrope pour body text

### Sécurité
- Inputs validés (zod, validation manuelle)
- Auth vérifié sur endpoints protégés
- Pas de secrets côté client
- Sanitization si user input → DB ou LLM

### Scalabilité
- Pagination pour listes > 50 items
- Cache (Typesense, React Query, ISR) si données stables
- Lazy loading pour composants lourds
- Éviter N+1 queries
- Index DB si nouvelles requêtes fréquentes

### MongoDB - Architecture Connexions
- **JAMAIS** créer de `new MongoClient()` dans les routes API ou services
- Toujours utiliser `getDatabaseInstance()` de `apiComponents/utils/mongo.ts`
- Un seul client partagé pour tout le projet (évite l'épuisement des connexions)
- Pas de `client.close()` dans les routes (le pool gère automatiquement)
- Voir règle `mongodb.mdc` pour les détails

## Étapes

### 1. **Charger la PRD**
   - Demander à l'utilisateur de référencer la PRD : `@docs/specs/[feature]/prd.md`
   - Lire et analyser la PRD complète.
   - Résumer les points clés : objectif, user stories, specs fonctionnelles, hors scope.

### 2. **Analyser la Codebase**
   Explorer l'existant en profondeur :
   - **Composants/Services existants** : lesquels réutiliser, étendre, ou créer ?
   - **Patterns en place** : architecture, conventions, structure des fichiers
   - **Types/Interfaces** : lesquels impactés ou à créer ?
   - **APIs existantes** : endpoints à modifier ou créer ?
   - **Base de données** : collections/tables impactées ?

### 3. **Proposer l'Architecture**
   Présenter l'architecture technique proposée :

   ```
   ## Architecture Proposée

   ### Vue d'ensemble
   [Diagramme ou description du flow technique]

   ### Composants
   | Composant | Type | Action | Description |
   |-----------|------|--------|-------------|
   | [Nom] | [Nouveau/Existant] | [Créer/Modifier/Réutiliser] | [Rôle] |

   ### Flow de données
   [Description du parcours des données]
   ```

### 4. **Décisions Techniques**
   Pour chaque décision importante, présenter :

   ```
   ## Décisions Techniques

   ### Décision 1 : [Sujet]

   **Contexte** : [Pourquoi cette décision est nécessaire]

   **Options considérées** :

   | Option | Avantages | Inconvénients | Effort |
   |--------|-----------|---------------|--------|
   | Option A | [+] | [-] | [Faible/Moyen/Élevé] |
   | Option B | [+] | [-] | [Faible/Moyen/Élevé] |

   **Recommandation** : [Option choisie et justification]

   ---

   ### Décision 2 : [Sujet]
   ...
   ```

   Décisions typiques à adresser :
   - Choix de librairies/outils
   - Structure des données (DB, types)
   - Stratégie de cache
   - Gestion d'état (si frontend)
   - API design (endpoints, format)
   - Stratégie de migration si données existantes

### 5. **Impact sur l'Existant**
   Évaluer l'impact :

   ```
   ## Impact sur l'Existant

   ### Fichiers à modifier
   | Fichier | Type de modification | Risque |
   |---------|---------------------|--------|
   | [path] | [Ajout/Modification/Suppression] | [Faible/Moyen/Élevé] |

   ### Dépendances impactées
   - [Service/Composant] : [nature de l'impact]

   ### Risques de régression
   - [Risque 1] : [mitigation]

   ### Tests à prévoir
   - [Type de test] : [ce qu'il doit couvrir]
   ```

### 6. **Décomposition en Tâches**
   Découper en Epic → Stories → Tasks :

   ```
   ## Plan d'Implémentation

   ### Epic 1 : [Nom]

   #### Story 1.1 : [Titre]
   **Objectif** : [Ce que cette story accomplit]
   **Critères d'acceptation** : [Repris de la PRD]

   **Tasks** :
   - [ ] Task 1.1.1 : [Description technique précise]
   - [ ] Task 1.1.2 : [Description]
   - [ ] Task 1.1.3 : [Description]

   **Dépendances** : [Stories qui doivent être faites avant]
   **Estimation** : [S/M/L]

   #### Story 1.2 : [Titre]
   ...

   ### Epic 2 : [Nom]
   ...
   ```

   Règles pour les tasks :
   - Chaque task = 1 action technique claire
   - Inclure les tests dans les tasks
   - Indiquer les dépendances entre stories
   - Ordonnancer logiquement (fondations d'abord)

### 7. **Résumé et Prochaines Étapes**
   Conclure avec :

   ```
   ## Résumé

   ### Scope technique
   - [X] nouveaux composants/fichiers
   - [Y] fichiers modifiés
   - [Z] stories, [W] tasks

   ### Décisions à valider
   - [ ] [Décision 1] : [résumé]
   - [ ] [Décision 2] : [résumé]

   ### Risques principaux
   - [Risque le plus important]

   ### Prêt pour le build ?
   Oui / Points à clarifier avant
   ```

### 8. **Sauvegarder le Plan** (OBLIGATOIRE)
   Sauvegarder le plan dans : `/docs/specs/[feature]/plan.md`

   Le plan DOIT commencer par un header avec metadata :
   ```markdown
   # Plan Technique : [Nom de la Feature]

   **Date** : YYYY-MM
   **Statut** : Draft / En cours / Terminé
   **Branche** : `nom-de-la-branche-git`
   ```

   Le champ **Branche** permet à `/status` d'identifier quel plan est actif selon la branche courante.

   Le plan DOIT inclure des checkboxes `- [ ]` pour chaque tâche afin de tracker l'avancement :
   ```markdown
   ## Suivi d'Avancement

   - [ ] Task 1.1.1 : Description
   - [ ] Task 1.1.2 : Description
   - [ ] Task 1.2.1 : Description
   ```

   Ces checkboxes seront cochées (`- [x]`) au fur et à mesure de l'implémentation.

## Mise à Jour du Plan Pendant l'Implémentation

**IMPORTANT** : À chaque fois qu'une tâche du plan est complétée :
1. Ouvrir `docs/specs/[feature]/plan.md`
2. Cocher la tâche : `- [ ]` → `- [x]`
3. Ajouter des notes si l'implémentation a dévié du plan initial

Quand **toutes les tâches** sont complétées et validées :
1. Changer le statut : `**Statut** : Terminé`
2. Le plan reste en place comme **documentation historique** (decisions techniques, schemas, etc.)
3. `/status` ignorera automatiquement les plans marqués `Terminé`

Cela permet à n'importe quel développeur de reprendre le travail via `/status`.

## Notes
- Ne pas commencer l'implémentation avant validation du plan.
- Si une décision technique nécessite plus de recherche, le signaler.
- Rester aligné avec les conventions et patterns existants du projet.
- En cas de doute sur un choix technique, demander l'avis du CTPO.
