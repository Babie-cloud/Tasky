---
title: Facturation Stripe
description: Checkout, portail client et webhook.
---

## Endpoints authentifiés

<div class="api-endpoint-row"><span class="method-badge method-post">POST</span> /api/billing/create-checkout-session</div>
<div class="api-endpoint-row"><span class="method-badge method-post">POST</span> /api/billing/create-portal-session</div>
<div class="api-endpoint-row"><span class="method-badge method-get">GET</span> /api/billing/status</div>

Body checkout : `{ "plan": "pro" | "enterprise" }` ou un Price ID Stripe (`price_...`).

## Webhook

`POST /api/billing/webhook` — body **raw** (signature Stripe).  
Variables : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`.

## Frontend

Après paiement : redirection vers `/profile?tab=billing&success=true`.
