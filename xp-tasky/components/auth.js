const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;

// Configuration unique du transporteur Email (Nodemailer)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// INSCRIPTION
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirm_password, first_name, last_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (confirm_password !== undefined && password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account already exists with this email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      first_name: first_name || '',
      last_name: last_name || '',
    });

    const token = jwt.sign({ sub: newUser._id.toString(), email: newUser.email }, JWT_SECRET, {
      expiresIn: '2h',
    });

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      },
    });
} catch (err) {
  console.error('[Register Error]:', err);
  return res.status(500).json({ message: 'Server error.', debug: err.message, stack: err.stack });
}
});

// CONNEXION CLASSIQUE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, {
      expiresIn: '2h',
    });

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (err) {
    console.error('[Login Error]:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// CONNEXION GOOGLE
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({
        email,
        googleId,
        first_name: given_name || '',
        last_name: family_name || '',
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token, user: { id: user._id, email: user.email, first_name: user.first_name, last_name: user.last_name } });
  } catch (err) {
    console.error('[Google Auth Error]:', err);
    return res.status(401).json({ message: 'Authentification Google invalide.' });
  }
});

// CONNEXION FACEBOOK
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken, userID } = req.body;
    const fbResponse = await axios.get(`https://graph.facebook.com/${userID}`, {
      params: { fields: 'id,email,first_name,last_name', access_token: accessToken },
    });
    const { id: facebookId, email, first_name, last_name } = fbResponse.data;

    let user = await User.findOne({ $or: [{ facebookId }, { email }] });
    if (!user) {
      user = await User.create({
        email: email || `${facebookId}@facebook.local`,
        facebookId,
        first_name: first_name || '',
        last_name: last_name || '',
      });
    } else if (!user.facebookId) {
      user.facebookId = facebookId;
      await user.save();
    }

    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token, user: { id: user._id, email: user.email, first_name: user.first_name, last_name: user.last_name } });
  } catch (err) {
    console.error('[Facebook Auth Error]:', err);
    return res.status(401).json({ message: 'Authentification Facebook invalide.' });
  }
});

// DEMANDE DE RÉINITIALISATION DU MOT DE PASSE
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Réponse générique pour des raisons de sécurité
    if (!user) {
      return res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Valide 1 heure
    await user.save();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
const resetUrl = `${frontendUrl}/resetpassword?token=${resetToken}`;

    await transporter.sendMail({
      from: `"Tasky" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <p>Bonjour,</p>
        <p>Cliquez sur ce lien pour réinitialiser votre mot de passe (valide 1h) :</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
    });

    return res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
  } catch (err) {
    console.error('[Forgot Password Error Details]:', err);
    return res.status(500).json({ message: 'Erreur serveur lors de l\'envoi de l\'email.' });
  }
});

// CONFIRMATION DU NOUVEAU MOT DE PASSE
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Lien invalide ou expiré.' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (err) {
    console.error('[Reset Password Error]:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;