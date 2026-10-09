---
title: Déploiement Netlify
description: Build Angular + Functions Express sur un même site.
---

Fichier racine : `netlify.toml`.

## Build

1. `ng-tasky` — `npm ci && npm run build`
2. Vérification de `dist/ng-tasky/browser/index.html`
3. `xp-tasky` — `npm ci` (dépendances des Functions)

**Publish** : `ng-tasky/dist/ng-tasky/browser`  
**Functions** : `xp-tasky/netlify/functions/api.js`

## Redirects

- `/api/*` → fonction serverless
- `/users/*` → fonction serverless
- `/*` → `index.html` (SPA)

## Variables d’environnement

Voir [Variables d’environnement](/deployment/environment). Minimum : `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`.
