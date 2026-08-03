const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Pour l'inscription 
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

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      },
    });
  } catch (err) {
    console.error('[Register] Erreur serveur', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Pour la connection
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

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (err) {
    console.error('[Login] Erreur serveur', err);
    res.status(500).json({ message: 'Server error.' });
  }

  
});

// Connexion via Google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body; // le token envoyé par Angular
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
    res.json({ token, user: { id: user._id, email: user.email, first_name: user.first_name, last_name: user.last_name } });
  } catch (err) {
    console.error('[Google Auth] Erreur', err);
    res.status(401).json({ message: 'Authentification Google invalide.' });
  }
});

// Connexion via Facebook
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
    res.json({ token, user: { id: user._id, email: user.email, first_name: user.first_name, last_name: user.last_name } });
  } catch (err) {
    console.error('[Facebook Auth] Erreur', err);
    res.status(401).json({ message: 'Authentification Facebook invalide.' });
  }
}


);


// En cas d'oublie de mot de passe | Reset-Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Toujours répondre pareil, même si l'email n'existe pas (évite l'énumération de comptes)
    if (!user) {
      return res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1h
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: '"Tasky" <no-reply@tasky.com>',
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `<p>Bonjour,</p><p>Cliquez sur ce lien pour réinitialiser votre mot de passe (valide 1h) :</p><a href="${resetUrl}">${resetUrl}</a>`,
    });

    res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
  } catch (err) {
    console.error('[Forgot Password] Erreur', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

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
        res.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (err) {
    console.error('[Reset Password] Erreur', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});


module.exports = router;