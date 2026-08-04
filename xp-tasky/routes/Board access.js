const Board = require('../models/Board');

const ROLE_WEIGHT = { observer: 1, member: 2, admin: 3 };

function boardAccess(minRole = 'observer') {
  return async (req, res, next) => {
    try {
      const boardId = req.params.boardId || req.body.board || req.query.board;
      if (!boardId) {
        return res.status(400).json({ message: 'Identifiant du tableau manquant.' });
      }

      const board = await Board.findById(boardId);
      if (!board) {
        return res.status(404).json({ message: 'Tableau introuvable.' });
      }

      const isOwner = board.owner.toString() === req.userId;
      const member = board.members.find(
        (m) => m.status === 'active' && m.user && m.user.toString() === req.userId
      );

      const role = isOwner ? 'admin' : member?.role;
      if (!role) {
        return res.status(403).json({ message: 'Accès refusé à ce tableau.' });
      }

      if (ROLE_WEIGHT[role] < ROLE_WEIGHT[minRole]) {
        return res.status(403).json({ message: 'Permissions insuffisantes.' });
      }

      req.board = board;
      req.memberRole = role;
      next();
    } catch (err) {
      console.error('[Board Access Error]:', err);
      res.status(500).json({ message: 'Erreur serveur.' });
    }
  };
}

module.exports = boardAccess;