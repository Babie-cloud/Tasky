var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Profil de l'utilisateur connecté
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Profil utilisateur }
 *       401: { description: Non authentifié }
 *   put:
 *     tags: [Users]
 *     summary: Mettre à jour le profil
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               phone: { type: string }
 *               bio: { type: string, maxLength: 280 }
 *     responses:
 *       200: { description: Profil mis à jour }
 *   delete:
 *     tags: [Users]
 *     summary: Supprimer le compte
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Compte supprimé }
 *
 * /users/me/password:
 *   put:
 *     tags: [Users]
 *     summary: Changer le mot de passe
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Mot de passe changé }
 */

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
  'notifyOnInvite',
  'notifyOnRemoval',
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

router.put('/me/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau requis.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit faire au moins 8 caractères.' });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password); 
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
    }

    user.password = await bcrypt.hash(newPassword, 10); 
    await user.save();

    res.json({ message: 'Mot de passe mis à jour.' });
  } catch (err) {
    console.error('[Change Password Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/me', async (req, res) => {
  try {
    const Board = require('../models/Board');
    await Board.updateMany(
      { 'members.user': req.userId },
      { $pull: { members: { user: req.userId } } }
    );

    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Compte supprimé.' });
  } catch (err) {
    console.error('[Delete Account Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;