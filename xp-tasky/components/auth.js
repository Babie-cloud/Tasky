const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

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
});

module.exports = router;