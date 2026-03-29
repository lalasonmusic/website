# Commit et Push des Changements

## Objectif
Commiter uniquement les fichiers modifiés pendant ce chat, après une revue qualité complète, puis pousser sur la branche distante.

## Règles Importantes
- **NE PAS** commiter tous les fichiers présents dans `git status`.
- **UNIQUEMENT** commiter les fichiers que tu as modifiés/créés pendant ce chat.
- Si tu n'as modifié aucun fichier pendant ce chat, ne rien commiter et informer l'utilisateur.
- **NE JAMAIS** push sur `main` ou `master` sans confirmation explicite de l'utilisateur.

## Étapes

### 1. **Identifier les Fichiers Modifiés**
   - Lister mentalement les fichiers que tu as modifiés/créés pendant ce chat.
   - Exécuter `git status` pour voir l'état actuel.
   - Croiser les deux pour identifier précisément les fichiers à commiter.

### 2. **Vérifier la Branche**
   - Exécuter `git branch --show-current` pour identifier la branche actuelle.
   - Si sur `main` ou `master`, **ARRÊTER** et demander confirmation à l'utilisateur.
   - Vérifier si la branche a un upstream : `git rev-parse --abbrev-ref @{upstream}`

### 3. **Analyse d'Impact (Rien Cassé Ailleurs ?)**
   - Pour chaque fonction/composant/type/interface modifié :
     - Rechercher tous les usages dans le codebase avec grep/recherche sémantique.
     - Vérifier que les modifications sont compatibles avec les appelants.
   - **Changements de signature** : S'assurer que tous les appelants sont mis à jour.
   - **Modifications de types/interfaces** : Vérifier l'impact sur les fichiers qui les importent.
   - **Fichiers de config** (`/config`, `/types`) : Impact potentiellement large, vérifier minutieusement.
   - **Suppression de code** : S'assurer qu'il n'est plus utilisé nulle part.
   - Si un impact est détecté, **corriger** les fichiers affectés ou **avertir** l'utilisateur.

### 4. **Quality Review par Type de Fichier**

   #### Composants React/TSX
   - Props typées correctement (pas de `any`)
   - Hooks respectent les règles (pas de hooks conditionnels)
   - Keys uniques dans les listes/maps
   - Gestion des états de chargement et d'erreur
   - Pas de re-renders inutiles (mémoisation si nécessaire)
   - Accessibilité : attributs `aria-*`, `alt` sur images, labels sur inputs

   #### Fichiers TypeScript/Logic
   - Types explicites (pas de `any` sauf justifié)
   - Gestion d'erreurs avec try/catch où nécessaire
   - Pas de variables inutilisées
   - Pas de code mort ou commenté
   - Fonctions pures quand possible

   #### Fichiers CSS/Tailwind
   - Pas de styles en dur qui devraient être des variables/tokens
   - Classes Tailwind ordonnées logiquement
   - Responsive design vérifié (classes `sm:`, `md:`, `lg:`)
   - Pas de `!important` sauf nécessité absolue

   #### Fichiers de Configuration
   - Pas de valeurs en dur qui devraient être dans `.env`
   - Compatibilité avec l'environnement cible
   - Pas de dépendances inutiles ajoutées

### 5. **Vérifications Techniques**
   - Exécuter `pnpm type-check` pour valider les types.
   - Exécuter `pnpm lint` pour vérifier le linting.
   - Si des erreurs bloquantes sont détectées, les corriger avant de continuer.
   - **NE PAS** corriger les warnings non liés aux fichiers modifiés.

### 6. **Vérification de Sécurité**
   - Scanner les fichiers à commiter pour détecter :
     - Clés API / tokens / secrets en dur
     - Fichiers `.env` ou credentials
     - Données sensibles (emails, passwords, PII)
     - `console.log` avec données sensibles
     - `dangerouslySetInnerHTML` sans sanitization
   - Si détecté, **ARRÊTER** et avertir l'utilisateur.

### 7. **Rapport de Quality Review**
   Avant de commiter, afficher un résumé sous ce format :

   ```
   ## Quality Review Report

   ### Fichiers à commiter
   - fichier1.tsx ✅
   - fichier2.ts ✅

   ### Vérifications
   - [ ] Type-check : ✅ Passé / ❌ Échoué
   - [ ] Lint : ✅ Passé / ❌ Échoué
   - [ ] Sécurité : ✅ RAS / ⚠️ Attention
   - [ ] Impact analysis : ✅ RAS / ⚠️ Changements détectés

   ### Problèmes détectés
   (liste des problèmes ou "Aucun problème détecté")
   ```

### 8. **Générer le Message de Commit**
   - Format : `type(scope): description`
   - Types : `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`
   - Scope : le module ou composant principal affecté
   - Description : courte, en anglais, au présent impératif

### 9. **Exécuter le Commit**
   ```bash
   # Ajouter UNIQUEMENT les fichiers modifiés pendant ce chat
   git add <fichier1> <fichier2> ...

   # Commiter avec le message généré
   git commit -m "$(cat <<'EOF'
   type(scope): description

   - Détail 1 si nécessaire
   - Détail 2 si nécessaire
   EOF
   )"
   ```

### 10. **Push**
   ```bash
   # Si la branche n'a pas d'upstream, le configurer
   git push -u origin HEAD

   # Sinon, simple push
   git push
   ```

### 11. **Confirmation**
   - Exécuter `git status` pour confirmer l'état propre.
   - Afficher `git log -1` pour montrer le commit.
   - Confirmer que le push a réussi.

## Notes
- Si l'utilisateur demande de commiter des fichiers spécifiques, respecter sa demande.
- Ne jamais utiliser `git add .` ou `git add -A` sans confirmation explicite.
- Ne jamais utiliser `git push --force` sans confirmation explicite.
- Si le push est rejeté (branche distante en avance), proposer un `git pull --rebase` d'abord.
- Si la Quality Review révèle des problèmes, les corriger AVANT de commiter.
