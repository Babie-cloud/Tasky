const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');
const User = require('../models/User');
const requireAuth = require('../middlewares/auth');
const boardAccess = require('../middlewares/board-access');
const { sendBoardInviteEmail, sendMemberRemovedEmail } = require('../utils/mailer');

router.use(requireAuth);

const DEFAULT_LISTS = ['À faire', 'En cours', 'Terminé'];

/**
 * @swagger
 * /api/boards/mine:
 *   get:
 *     summary: Récupérer tous les tableaux de l'utilisateur
 *     description: Retourne la liste des tableaux dont l'utilisateur connecté est propriétaire ou membre actif.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des tableaux récupérée avec succès.
 *       500:
 *         description: Erreur serveur.
 */
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

/**
 * @swagger
 * /api/boards:
 *   post:
 *     summary: Créer un nouveau tableau
 *     description: Crée un tableau avec les listes par défaut (À faire, En cours, Terminé).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Projet SaaS Tasky
 *     responses:
 *       201:
 *         description: Tableau créé avec succès.
 *       500:
 *         description: Erreur serveur.
 */
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

/**
 * @swagger
 * /api/boards/{boardId}:
 *   get:
 *     summary: Charger un tableau précis
 *     description: Retourne les détails d'un tableau spécifique si l'utilisateur y a accès (rôle minimum observateur).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du tableau
 *     responses:
 *       200:
 *         description: Détails du tableau récupérés avec succès.
 *       403:
 *         description: Permissions insuffisantes ou accès refusé.
 *       404:
 *         description: Tableau introuvable.
 *       500:
 *         description: Erreur serveur.
 */
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

/**
 * @swagger
 * /api/boards/{boardId}:
 *   put:
 *     summary: Renommer un tableau
 *     description: Permet à un administrateur ou au propriétaire de modifier le nom d'un tableau.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nouveau nom du projet
 *     responses:
 *       200:
 *         description: Tableau mis à jour avec succès.
 *       403:
 *         description: Permissions insuffisantes.
 *       404:
 *         description: Tableau introuvable.
 *       500:
 *         description: Erreur serveur.
 */
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

/**
 * @swagger
 * /api/boards/{boardId}:
 *   delete:
 *     summary: Supprimer un tableau
 *     description: Suppression complète du tableau et de ses listes/tâches. Réservée strictement au créateur (owner).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tableau supprimé avec succès.
 *       403:
 *         description: Seul le créateur du tableau peut le supprimer.
 *       404:
 *         description: Tableau introuvable.
 *       500:
 *         description: Erreur serveur.
 */
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

/**
 * @swagger
 * /api/boards/{boardId}/invite:
 *   post:
 *     summary: Inviter un membre sur le tableau
 *     description: Envoie un lien d'invitation par e-mail à un utilisateur avec un rôle spécifique (admin, member, observer).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: collaborateur@example.com
 *               role:
 *                 type: string
 *                 enum: [admin, member, observer]
 *                 example: member
 *     responses:
 *       201:
 *         description: Invitation envoyée.
 *       400:
 *         description: Email requis ou rôle invalide.
 *       409:
 *         description: Personne déjà invitée ou membre.
 *       500:
 *         description: Erreur serveur.
 */
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

/**
 * @swagger
 * /api/boards/invite/accept/{token}:
 *   post:
 *     summary: Accepter une invitation à un tableau
 *     description: Valide le jeton d'invitation et ajoute l'utilisateur comme membre actif du tableau.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation acceptée.
 *       403:
 *         description: L'invitation ne correspond pas au compte connecté.
 *       404:
 *         description: Invitation invalide ou expirée.
 *       500:
 *         description: Erreur serveur.
 */
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

/**
 * @swagger
 * /api/boards/{boardId}/members/{memberId}:
 *   put:
 *     summary: Modifier le rôle d'un membre
 *     description: Permet à un administrateur de changer le rôle d'un membre du tableau.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, member, observer]
 *     responses:
 *       200:
 *         description: Rôle modifié avec succès.
 *       400:
 *         description: Rôle invalide.
 *       404:
 *         description: Membre introuvable.
 *       500:
 *         description: Erreur serveur.
 */
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

/**
 * @swagger
 * /api/boards/{boardId}/members/{memberId}:
 *   delete:
 *     summary: Retirer un membre du tableau
 *     description: Permet à un administrateur ou au propriétaire de retirer un collaborateur du tableau.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Membre retiré avec succès.
 *       403:
 *         description: Permissions insuffisantes.
 *       404:
 *         description: Membre introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.delete('/:boardId/members/:memberId', boardAccess('admin'), async (req, res) => {
  try {
    const currentMember = req.board.members.find(
      (m) => m.user && m.user.toString() === req.userId
    );
    const isOwner = req.board.owner.toString() === req.userId;
    const isAdmin = isOwner || (currentMember && currentMember.role === 'admin');

    if (!isAdmin) {
      return res.status(403).json({
        message: 'Seul un administrateur ou le créateur du tableau peut retirer un membre.',
      });
    }

    const member = req.board.members.id(req.params.memberId);
    if (!member) return res.status(404).json({ message: 'Membre introuvable.' });

    const removedEmail = member.email;
    member.deleteOne();
    await req.board.save();

    const owner = await User.findById(req.userId);
    sendMemberRemovedEmail({
      to: removedEmail,
      boardName: req.board.name,
      removedByName: `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email,
    }).catch((err) => console.error('[Member Removed Email Error]:', err));

    res.json(req.board);
  } catch (err) {
    console.error('[Remove Member Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;