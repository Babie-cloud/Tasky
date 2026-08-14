const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');
const requireAuth = require('../middlewares/auth');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

router.use(requireAuth);

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PRICE_IDS[plan]) {
      return res.status(400).json({ message: 'Plan invalide.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    // Réutilise le Customer Stripe existant, ou en crée un nouveau
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || undefined,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${FRONTEND_URL}/profile?tab=billing&success=true`,
      cancel_url: `${FRONTEND_URL}/pricing?canceled=true`,
      metadata: { userId: user._id.toString(), plan },
      subscription_data: {
        metadata: { userId: user._id.toString(), plan },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Create Checkout Session Error]:', err);
    res.status(500).json({ message: 'Erreur lors de la création de la session de paiement.' });
  }
});

// Crée une session vers le Customer Portal Stripe (gérer / annuler l'abonnement)
router.post('/create-portal-session', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.stripeCustomerId) {
      return res.status(400).json({ message: 'Aucun abonnement actif.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${FRONTEND_URL}/profile?tab=billing`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Create Portal Session Error]:', err);
    res.status(500).json({ message: 'Erreur lors de la création de la session.' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('subscriptionPlan subscriptionStatus');
    res.json({
      plan: user.subscriptionPlan || 'free',
      status: user.subscriptionStatus,
    });
  } catch (err) {
    console.error('[Billing Status Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;