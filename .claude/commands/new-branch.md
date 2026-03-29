# Nouvelle Branche de Fonctionnalité

## Objectif
Préparer l'environnement de développement en partant d'une base propre et à jour sur `dev`.

## Étapes

1. **Mise à jour de la base**
   - Exécuter `git checkout dev` pour basculer sur la branche de développement principale.
   - Exécuter `git pull origin dev` pour s'assurer d'avoir la dernière version du code.

2. **Création de la branche**
   - Analyser le contexte de la conversation ou demander explicitement à l'utilisateur quel est le sujet de la tâche pour déterminer un nom de branche pertinent.
   - Le nom de la branche doit être en `kebab-case` et préfixé par le type de tâche si possible (ex: `feature/nom-tache`, `fix/nom-bug`, `chore/nom-tache`).
   - Créer la nouvelle branche avec `git checkout -b <nom-de-la-branche>`.

3. **Confirmation**
   - Confirmer à l'utilisateur que nous sommes bien sur la nouvelle branche et que `dev` était à jour.
