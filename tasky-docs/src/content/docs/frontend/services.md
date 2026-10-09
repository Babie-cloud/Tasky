---
title: Services & API client
description: Comment le frontend consomme l’API REST Tasky.
---

Tous les services utilisent `environment.apiUrl` :

- **Production** : chaîne vide → requêtes relatives `/api/...` (même domaine Netlify).
- **Développement** : `http://localhost:3000`.

## Services principaux

| Service | Base URL | Usage |
| ------- | -------- | ----- |
| `AuthService` | `/api/auth` | login, register, OAuth, reset MDP |
| `UserService` | `/users` | profil `/users/me` |
| `BoardService` | `/api/boards` | CRUD boards, invitations |
| `ListService` | `/api/lists?board=` | colonnes Kanban |
| `TaskService` | `/api/tasks?board=` | tâches, drag & drop |
| `CategoryService` | `/api/categories?board=` | labels |
| `BillingService` | `/api/billing` | Stripe checkout / statut |

## Intercepteur JWT

`authInterceptor` ajoute :

```http
Authorization: Bearer <token>
```

Le token est stocké dans `localStorage` sous la clé `auth_token`.

## Exemple — créer un board

```typescript
this.boardService.createBoard('Mon projet').subscribe((board) => {
  console.log(board._id);
});
```
