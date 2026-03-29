# Lalason

Plateforme de musique libre de droit par abonnement. Catalogue de musiques exclusives creees par des artistes francais, destine aux createurs de contenus et aux espaces accueillant du public.

## Statut du projet

**En cours de planification** — Migration depuis Wix vers une stack moderne.

- [brainstorm.md](brainstorm.md) — Document de brainstorming et decisions techniques

## Stack technique (prevue)

| Brique | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router) |
| Hebergement | Vercel |
| Base de donnees | Supabase (PostgreSQL) |
| ORM | Drizzle |
| Auth | Supabase Auth |
| Paiement | Stripe |
| Storage audio | Supabase Storage |
| i18n | next-intl (FR/EN) |
| Styling | Tailwind CSS + shadcn/ui |
| Analytics | PostHog + Vercel Analytics |
| Validation | Zod |

## Structure du projet

```
lalason/
├── brainstorm.md          # Brainstorming et decisions
├── docs/
│   └── specs/             # PRDs et plans techniques
├── src/                   # Code source (a venir)
└── README.md
```

## Processus de developpement

1. **Brainstorm** → brainstorm.md (en cours)
2. **PRD** → `/prd` pour formaliser les specifications
3. **Plan technique** → `/plan-tech` pour l'architecture detaillee
4. **Code** → Implementation

## Liens utiles

- **Site actuel** : [lalason.com](https://www.lalason.com)
- **Vercel** : Dashboard de deploiement
- **Supabase** : Console base de donnees
- **Stripe** : Dashboard paiements
