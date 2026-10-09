---
title: Rôles & permissions
description: Propriétaire, admin, membre, observateur.
---

Chaque board possède :

- un **owner** (propriétaire, droits admin implicites) ;
- des **members** avec rôle et statut (`pending` / `active`).

## Hiérarchie

| Rôle | Poids | Capacités typiques |
| ---- | ----- | ------------------ |
| **observer** | 1 | Lecture seule |
| **member** | 2 | Créer / déplacer des tâches, listes |
| **admin** | 3 | Invitations, catégories, suppression |

Le middleware `boardAccess(minRole)` compare le poids du rôle utilisateur au minimum requis.

## Invitations

Endpoints board (voir OpenAPI) :

- invitation par email avec token ;
- acceptation via `/accept-invite` côté frontend ;
- retrait d’un membre (notification email optionnelle).
