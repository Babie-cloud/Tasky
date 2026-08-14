const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/', async (req, res) => {
  let event;

  try {
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        if (userId && plan) {
          await User.findByIdAndUpdate(userId, {
            subscriptionPlan: plan,
            subscriptionStatus: 'active',
            stripeSubscriptionId: session.subscription,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            subscriptionStatus: subscription.status,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            subscriptionPlan: 'free',
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
          });
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Erreur de traitement:', err);
    res.status(500).json({ message: 'Erreur de traitement du webhook.' });
  }
});

module.exports = router;