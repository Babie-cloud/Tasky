const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');
const User = require('../models/User');
const requireAuth = require('../middlewares/auth');
const boardAccess = require('../middlewares/board-access');
const { sendBoardInviteEmail } = require('../utils/mailer');

router.use(requireAuth);

const DEFAULT_LISTS = ['À faire', 'En cours', 'Terminé'];

// Tous les tableaux de l'utilisateur (owner OU membre actif)
router.get('/mine', async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [
        { owner: req.userId },
        { members: { $elemMatch: { user: req.userId, status: 'active' } } },
      ],
    })
      .populate('owner', 'email first_name last_name')
      .populate('members.user', 'email first_name last_name')
      .sort({ updatedAt: -1 });

    res.json(boards);
  } catch (err) {
    console.error('[Get My Boards Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Créer un nouveau tableau
router.post('/', async (req, res) => {
  try {
    const name = (req.body.name || '').trim() || 'Nouveau tableau';
    const board = await Board.create({ name, owner: req.userId, members: [] });

    await List.insertMany(
      DEFAULT_LISTS.map((title, index) => ({ board: board._id, title, order: index }))
    );

    const populated = await Board.findById(board._id)
      .populate('owner', 'email first_name last_name')
      .populate('members.user', 'email first_name last_name');

    res.status(201).json(populated);
  } catch (err) {
    console.error('[Create Board Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Charger un tableau précis
router.get('/:boardId', boardAccess('observer'), async (req, res) => {
  try {
    const board = await Board.findById(req.board._id)
      .populate('owner', 'email first_name last_name')
      .populate('members.user', 'email first_name last_name');
    res.json(board);
  } catch (err) {
    console.error('[Get Board Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

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

// Suppression complète du tableau — réservée strictement au owner (créateur),
// pas aux membres au rôle "admin". Cascade sur les listes et les tâches.
router.delete('/:boardId', boardAccess('observer'), async (req, res) => {
  try {
    if (req.board.owner.toString() !== req.userId) {
      return res.status(403).json({
        message: 'Seul le créateur du tableau peut le supprimer.',
      });
    }

    await Task.deleteMany({ board: req.board._id });
    await List.deleteMany({ board: req.board._id });
    await req.board.deleteOne();

    res.json({ message: 'Tableau supprimé.' });
  } catch (err) {
    console.error('[Delete Board Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

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