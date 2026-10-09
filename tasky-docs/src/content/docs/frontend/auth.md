---
title: Authentification (Frontend)
description: Flux login, JWT, Google et Facebook côté Angular.
---

## Inscription / connexion classique

1. `AuthService.signup()` ou `login()` → `POST /api/auth/register` ou `/login`.
2. La réponse contient `{ token, user }`.
3. Le token est persisté ; l’intercepteur l’envoie sur les routes protégées.

## OAuth

- **Google** : bouton GIS, envoi de `credential` à `POST /api/auth/google`.
- **Facebook** : SDK JS, envoi de `accessToken` + `userID` à `POST /api/auth/facebook`.

Les identifiants publics sont dans `environment.ts` (`googleClientId`, `facebookAppId`).

## Mot de passe oublié

1. `POST /api/auth/forgot-password` avec l’email.
2. L’utilisateur ouvre le lien reçu → `/resetpassword?token=...`.
3. `POST /api/auth/reset-password` avec le nouveau mot de passe.

## Déconnexion

`AuthService.logout()` supprime le token et redirige vers la landing ou le login.
