var express = require('express');
var router = express.Router();
const User = require('../models/User');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

const PROFILE_FIELDS = [
  'first_name',
  'last_name',
  'phone',
  'location',
  'birthDate',
  'bio',
  'linkedIn',
  'github',
  'jobTitle',
];

// Récupérer les infos de l'utilisateur connecté
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      '-password -resetPasswordToken -resetPasswordExpires'
    );
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(user);
  } catch (err) {
    console.error('[Get Me Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Modifier le profil
router.put('/me', async (req, res) => {
  try {
    const updates = {};
    for (const field of PROFILE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(user);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const firstError = Object.values(err.errors)[0];
      return res.status(400).json({ message: firstError.message });
    }
    console.error('[Update Me Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;