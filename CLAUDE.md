## Regles Critiques (NON-NEGOCIABLES)

Ces regles sont ABSOLUES et ne doivent JAMAIS etre contournees.

1. **NO DELETIONS** : Ne JAMAIS supprimer de donnees ou fichiers sans confirmation explicite de l'utilisateur.
2. **NO AUTO-COMMIT** : Ne JAMAIS commiter de changements sauf si explicitement demande par l'utilisateur.
3. **NO UNSOLICITED DOCS** : Ne JAMAIS generer de fichiers Markdown de documentation sauf si explicitement demande.
4. **NO SECRETS** : Ne JAMAIS commiter de fichiers `.env` ou de cles API.
5. **NO BRANCH SWITCH** : Ne JAMAIS changer de branche git sauf si explicitement demande par l'utilisateur.
6. **NO SCHEMA CHANGES** : Ne JAMAIS modifier les schemas sans confirmation explicite de l'utilisateur.
7. **NO BRANCH DELETE** : Ne JAMAIS supprimer de branche git (locale ou remote) sauf si explicitement demande par l'utilisateur. Lors d'un merge de PR, utiliser `gh pr merge --merge` SANS `--delete-branch`.

---

## Stack Technique & Architecture

### Technologies
- **Framework** : Next.js 15 (App Router)
- **Language** : TypeScript
- **UI** : Tailwind CSS + shadcn/ui
- **Search Engine** : Supabase Full-Text Search (Phase 1) → Meilisearch (Phase 2)
- **Database** : Supabase (PostgreSQL) + Drizzle ORM
- **Auth** : Supabase Auth
- **Paiement** : Stripe (Checkout + Billing + Portal)
- **Storage audio** : Supabase Storage (Phase 1) → Cloudflare R2 (Phase 2)
- **i18n** : next-intl (FR/EN)
- **Analytics** : PostHog + Vercel Analytics
- **Validation** : Zod
- **Newsletter** : MailerLite (service externe)
- **Hosting** : Vercel

### Structure des Repertoires Cles

```
lalason/
├── CLAUDE.md                # Ce fichier
├── brainstorm.md            # Brainstorming et decisions
├── README.md                # Presentation du projet
├── docs/
│   └── specs/               # PRDs et plans techniques
├── src/
│   ├── app/                 # Next.js App Router (pages, layouts, routes API)
│   │   ├── [locale]/        # Routes i18n (fr, en)
│   │   ├── admin/           # Back-office admin (routes protegees)
│   │   └── api/             # API routes (webhooks Stripe, etc.)
│   ├── components/          # Composants React reutilisables
│   ├── lib/                 # Logique metier, services, utilitaires
│   ├── db/                  # Schema Drizzle, migrations, seeds
│   └── styles/              # Styles globaux, variables CSS
├── public/                  # Assets statiques
├── messages/                # Fichiers de traduction i18n (fr.json, en.json)
└── .env.local               # Variables d'environnement (JAMAIS commit)
```

---

## Conventions de Code

### Principes Architecturaux (SOLID)
- **Single Responsibility** : Une fonction/composant = une seule responsabilite
- **Open/Closed** : Preferer l'extension a la modification de l'existant
- **Interface Segregation** : Interfaces petites et specifiques (pas de "god interfaces")
- **Dependency Inversion** : Injecter les dependances, ne pas les instancier

### Abstraction des Providers (Adapter Pattern)

**Principe** : Coder contre des interfaces/abstractions, pas contre des implementations concretes.

```typescript
// ❌ Couplage direct - difficile a changer
const { data } = await supabase.from('tracks').select('*');

// ✅ Abstraction - facile a swapper
const tracks = await trackService.getAll();
```

### Complexite & Lisibilite
- **Fonctions courtes** : Max ~50 lignes. Au-dela, decouper.
- **Imbrication limitee** : Max 3 niveaux. Preferer les early returns.
- **Nommage explicite** : Les noms doivent decrire le "quoi", pas le "comment".
- **Pas de magic values** : Extraire les constantes avec des noms descriptifs.

### Styles - Brand Kit Variables CSS Obligatoires
**JAMAIS de valeurs en dur.** Toujours utiliser les variables CSS du design system.
- **Font unique** : Poppins (Google Font) — Menu: 500, Body: 400/italic, Boutons: 600, Sous-titres: 500, Titres: 800

### Appels Externes (APIs, Services)
- **Timeout obligatoire** : Ne jamais laisser de timeout infini sur les appels externes.
- **Retry avec backoff** : Pour les operations idempotentes (GET, lectures).
- **Fallback gracieux** : Prevoir un comportement degrade si le service est down.

### Anti-patterns a Eviter
- ❌ God objects/functions (>100 lignes, multiples responsabilites)
- ❌ Couplage fort entre modules (imports circulaires, dependances cachees)
- ❌ Magic numbers/strings (valeurs en dur sans constante nommee)
- ❌ Etats mutables partages entre composants (preferer le state lifting ou context)
- ❌ Configuration hardcodee (devrait etre dans env/config)
- ❌ Transactions DB non atomiques (operations qui devraient etre groupees)

---

## Workflow de Developpement

### Principe : Chaque feature majeure suit le cycle PRD → Plan → Build → Track

```
1. /prd          → Genere docs/specs/YYYY-MM-feature/prd.md
2. /plan-tech    → Genere docs/specs/YYYY-MM-feature/plan.md (avec checkboxes)
3. /task         → Implemente une tache (verifie les plans existants, coche les taches)
4. /status       → Reprend le contexte entre sessions (affiche l'avancement)
```

### Plans et Tracking
- **Les plans vivent dans `docs/specs/`** (pas `.cursor/plans/` ni ailleurs)
- Chaque `plan.md` contient des checkboxes `- [ ]` / `- [x]` pour le suivi
- A chaque tache completee → cocher dans le plan
- `/status` en debut de session pour reprendre le fil

### Quand utiliser quoi ?
- **Feature majeure** (multi-fichiers, decisions archi) → `/prd` + `/plan-tech` + `/task`
- **Tache simple** (bug fix, petit ajout) → `/task` directement
- **Reprise apres interruption** → `/status`

---

## Commandes Disponibles

Les commandes personnalisees sont dans `.claude/commands/` :

### Workflow
- `/status` : Reprendre le contexte entre sessions (affiche plans actifs)
- `/prd` : Generer une PRD depuis des notes
- `/plan-tech` : Generer un plan technique depuis une PRD
- `/task` : Implementer une tache avec analyse prealable

### Git & Deploy
- `/new-branch` : Creer une nouvelle branche de feature
- `/commit-push` : Commit + push avec quality review
