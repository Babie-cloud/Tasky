const express = require('express');
const router = express.Router();

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}
router.post('/create-intent', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        message: 'A key is missing!',
      });
    }

    const hotelId = Number(req.body.hotelId);
    const nuits = Number(req.body.nuits);
    const hotels = require('./hotels.json');
    const hotel = hotels.find((h) => h.id === hotelId);

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found.' });
    }
    if (!nuits || nuits < 1) {
      return res.status(400).json({ message: 'Invalid number of nights.' });
    }

    const montantEnCentimes = Math.round(hotel.prix * nuits * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: montantEnCentimes,
      currency: 'eur',
      metadata: {
        hotelId: String(hotel.id),
        hotelNom: hotel.nom,
        nuits: String(nuits),
      },
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      montant: montantEnCentimes / 100,
    });
  } catch (err) {
    console.error('Error creating PaymentIntent:', err);
    res.status(500).json({ message: 'Error creating payment.' });
  }
});

router.get('/status/:paymentIntentId', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: 'STRIPE_SECRET_KEY is missing.' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.paymentIntentId);
    res.json({ status: paymentIntent.status });
  } catch (err) {
    console.error('Error retrieving status:', err);
    res.status(500).json({ message: 'Error verifying payment.' });
  }
});

module.exports = router;