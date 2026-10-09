---
title: Variables d’environnement
description: Configuration backend et Netlify.
---

Copier `xp-tasky/.env.example` vers `.env` en local.

| Variable | Obligatoire | Description |
| -------- | ----------- | ----------- |
| `MONGO_URI` | Oui | Chaîne MongoDB Atlas ou local |
| `JWT_SECRET` | Oui | Secret de signature JWT |
| `FRONTEND_URL` | Prod | URL publique (emails, Stripe, CORS) |
| `GOOGLE_CLIENT_ID` | OAuth | Connexion Google |
| `SMTP_*` | Emails | Reset mot de passe, invitations |
| `STRIPE_*` | Billing | Paiements et webhooks |

Sur **Netlify**, définir les mêmes clés dans *Site settings → Environment variables*, puis redéployer.
