---
title: Authentification JWT
description: Endpoints auth et format du token.
---

## Endpoints publics

<div class="api-endpoint-row"><span class="method-badge method-post">POST</span> /api/auth/register</div>
<div class="api-endpoint-row"><span class="method-badge method-post">POST</span> /api/auth/login</div>
<div class="api-endpoint-row"><span class="method-badge method-post">POST</span> /api/auth/google</div>
<div class="api-endpoint-row"><span class="method-badge method-post">POST</span> /api/auth/facebook</div>
<div class="api-endpoint-row"><span class="method-badge method-post">POST</span> /api/auth/forgot-password</div>
<div class="api-endpoint-row"><span class="method-badge method-post">POST</span> /api/auth/reset-password</div>

## Payload JWT

Claims principaux :

- `sub` — ID utilisateur MongoDB
- `email` — email du compte
- Expiration : **2 h** (configurable dans `components/auth.js`)

## Exemple login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@tasky.app","password":"********"}'
```

Réponse :

```json
{
  "token": "eyJhbG...",
  "user": { "id": "...", "email": "dev@tasky.app" }
}
```

Détails complets : [Référence OpenAPI](/backend/api-reference).
