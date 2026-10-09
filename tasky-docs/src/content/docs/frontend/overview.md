---
title: Vue d’ensemble Frontend
description: Structure de l’application Angular Tasky.
---

Le frontend **ng-tasky** est une SPA **Angular 22** (standalone components, signals, interceptors HTTP).

## Dossiers clés

| Chemin | Rôle |
| ------ | ---- |
| `src/app/auth/` | Login, signup, reset password |
| `src/app/components/` | Dashboard, Kanban, profil, pricing |
| `src/app/core/services/` | Appels API (`AuthService`, `BoardService`, …) |
| `src/app/core/interceptors/` | JWT `Authorization` + gestion 401 |
| `src/environments/` | `apiUrl`, clés OAuth publiques |

## Routing

Les routes principales sont définies dans `app.routes.ts` :

- `/` — landing
- `/login`, `/signup`, `/resetpassword`
- `/dashboard-user` — liste des boards (protégé)
- `/pricing`, `/profile`, pages légales

Le **AuthGuard** redirige vers `/login` si aucun token n’est présent.

## Build production

```bash
cd ng-tasky
npm run build
```

Sortie statique : `dist/ng-tasky/browser/` (publiée par Netlify).
