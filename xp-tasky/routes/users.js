var express = require('express');
var router = express.Router();
const User = require('../models/User');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

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

// Modifier le profil (prénom, nom)
router.put('/me', async (req, res) => {
  try {
    const { first_name, last_name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { first_name, last_name },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');
    res.json(user);
  } catch (err) {
    console.error('[Update Me Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;