---
title: Architecture
description: Vue d’ensemble du monorepo Tasky — Angular, Express, Netlify, MongoDB.
---

Tasky est un **monorepo** avec trois applications complémentaires :

```text
Tasky/
├── ng-tasky/      # SPA Angular 22 (Kanban, auth, billing UI)
├── xp-tasky/      # API REST Express + Mongoose
└── tasky-docs/    # Documentation Starlight (ce site)
```

## Flux de données

1. L’utilisateur interagit avec **Angular** (`ng-tasky`).
2. Les services HTTP appellent `/api/*` (même origine en prod Netlify, ou `localhost:3000` en dev).
3. **Express** valide le JWT, applique les règles d’accès board, lit/écrit **MongoDB**.
4. **Stripe** gère les abonnements ; les webhooks mettent à jour le profil utilisateur.

## Modèle Kanban « double axe »

| Axe | Rôle | Exemple |
| --- | ---- | ------- |
| **Listes** | Statut d’avancement | À faire → En cours → Terminé |
| **Catégories** | Type de travail | Bug, Design, Feature |

Une tâche appartient à **une liste** (colonne) et peut porter **plusieurs catégories**.

## Déploiement production

Netlify publie le build Angular et expose l’API via **Netlify Functions** (`serverless-http`). Voir [Déploiement Netlify](/deployment/netlify).
