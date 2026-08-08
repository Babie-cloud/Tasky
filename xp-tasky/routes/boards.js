const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Board = require('../models/Board');
const List = require('../models/List');
const User = require('../models/User');
const requireAuth = require('../middlewares/auth');
const boardAccess = require('../middlewares/board-access');
const { sendBoardInviteEmail } = require('../utils/mailer');

router.use(requireAuth);

const DEFAULT_LISTS = ['À faire', 'En cours', 'Terminé'];

// Récupère le board unique de l'utilisateur, ou le crée s'il n'en a pas encore.
// Auto-réparation : si un board existe déjà mais n'a pas ses 3 listes (données
// issues d'une version antérieure, migration incomplète...), elles sont recréées.
router.get('/me', async (req, res) => {
  try {
    let board = await Board.findOne({
      $or: [
        { owner: req.userId },
        { members: { $elemMatch: { user: req.userId, status: 'active' } } },
      ],
    });

    if (!board) {
      board = await Board.create({ name: 'Mon tableau', owner: req.userId, members: [] });
    }

    const listCount = await List.countDocuments({ board: board._id });
    if (listCount === 0) {
      await List.insertMany(
        DEFAULT_LISTS.map((title, index) => ({ board: board._id, title, order: index }))
      );
    }

    board = await Board.findById(board._id)
      .populate('owner', 'email first_name last_name')
      .populate('members.user', 'email first_name last_name');

    res.json(board);
  } catch (err) {
    console.error('[Get Board Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Renommer le board
router.put('/:boardId', boardAccess('admin'), async (req, res) => {
  try {
    const { name } = req.body;
    if (name) req.board.name = name;
    await req.board.save();
    res.json(req.board);
  } catch (err) {
    console.error('[Rename Board Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Inviter un coworker par email, avec un rôle
router.post('/:boardId/invite', boardAccess('admin'), async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis.' });
    if (!['admin', 'member', 'observer'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (req.board.members.some((m) => m.email === normalizedEmail)) {
      return res.status(409).json({ message: 'Cette personne est déjà invitée ou membre.' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    const inviteToken = crypto.randomBytes(24).toString('hex');

    req.board.members.push({
      user: existingUser ? existingUser._id : null,
      email: normalizedEmail,
      role,
      status: 'pending',
      inviteToken,
      invitedAt: new Date(),
    });
    await req.board.save();

    const inviter = await User.findById(req.userId);
    await sendBoardInviteEmail({
      to: normalizedEmail,
      boardName: req.board.name,
      inviterName: `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() || inviter.email,
      token: inviteToken,
    });

    res.status(201).json({ message: 'Invitation envoyée.' });
  } catch (err) {
    console.error('[Invite Error]:', err);
    res.status(500).json({ message: "Erreur lors de l'envoi de l'invitation." });
  }
});

// Accepter une invitation (l'utilisateur doit être connecté avec l'email invité)
router.post('/invite/accept/:token', async (req, res) => {
  try {
    const board = await Board.findOne({ 'members.inviteToken': req.params.token });
    if (!board) return res.status(404).json({ message: 'Invitation invalide ou expirée.' });

    const member = board.members.find((m) => m.inviteToken === req.params.token);
    const currentUser = await User.findById(req.userId);

    if (member.email !== currentUser.email.toLowerCase()) {
      return res.status(403).json({ message: 'Cette invitation ne correspond pas à votre compte.' });
    }

    member.status = 'active';
    member.user = currentUser._id;
    member.inviteToken = null;
    await board.save();

    res.json({ message: 'Invitation acceptée.', boardId: board._id });
  } catch (err) {
    console.error('[Accept Invite Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Changer le rôle d'un membre
router.put('/:boardId/members/:memberId', boardAccess('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member', 'observer'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide.' });
    }
    const member = req.board.members.id(req.params.memberId);
    if (!member) return res.status(404).json({ message: 'Membre introuvable.' });
    member.role = role;
    await req.board.save();
    res.json(req.board);
  } catch (err) {
    console.error('[Change Role Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Retirer un membre du board
router.delete('/:boardId/members/:memberId', boardAccess('admin'), async (req, res) => {
  try {
    const member = req.board.members.id(req.params.memberId);
    if (!member) return res.status(404).json({ message: 'Membre introuvable.' });
    member.deleteOne();
    await req.board.save();
    res.json(req.board);
  } catch (err) {
    console.error('[Remove Member Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;