---
title: Vue d’ensemble Backend
description: API Express, MongoDB, middlewares et documentation OpenAPI.
---

L’API **xp-tasky** est une application **Express 4** avec **Mongoose**.

## Points d’entrée

| Route | Fichier |
| ----- | ------- |
| `/api/auth/*` | `components/auth.js` |
| `/users/*` | `routes/users.js` |
| `/api/boards/*` | `routes/boards.js` |
| `/api/lists/*` | `routes/lists.js` |
| `/api/tasks/*` | `routes/tasks.js` |
| `/api/categories/*` | `routes/categories.js` |
| `/api/billing/*` | `routes/billing.js` |

## Documentation interactive

| Outil | URL |
| ----- | --- |
| **Swagger UI** (tester les requêtes) | `/api-docs` |
| **OpenAPI JSON** | `/api-docs.json` |
| **Redoc** (site Astro) | [Référence OpenAPI](/backend/api-reference) |

## Authentification

Routes protégées : header

```http
Authorization: Bearer <JWT>
```

Secret : variable `JWT_SECRET`.

## Board scope

Les routes listes / tâches / catégories exigent l’identifiant du tableau via `?board=` ou `body.board`. Le middleware `boardAccess` vérifie le rôle minimum (observer, member, admin).
