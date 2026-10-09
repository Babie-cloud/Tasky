const express = require('express');
const router = express.Router();
const List = require('../models/List');
const Task = require('../models/Task');
const requireAuth = require('../middlewares/auth');
const boardAccess = require('../middlewares/board-access');

router.use(requireAuth);

/**
 * @swagger
 * /api/lists:
 *   get:
 *     tags: [Lists]
 *     summary: Lister les colonnes d'un tableau
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: board
 *         required: true
 *         schema: { type: string }
 *         description: ID du tableau Kanban
 *     responses:
 *       200: { description: Liste des colonnes triées par ordre }
 *   post:
 *     tags: [Lists]
 *     summary: Créer une colonne
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: board
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: Backlog }
 *               board: { type: string }
 *     responses:
 *       201: { description: Colonne créée }
 *
 * /api/lists/reorder:
 *   put:
 *     tags: [Lists]
 *     summary: Réordonner les colonnes
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: board
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderedIds: { type: array, items: { type: string } }
 *               board: { type: string }
 *     responses:
 *       200: { description: Ordre mis à jour }
 *
 * /api/lists/{id}:
 *   put:
 *     tags: [Lists]
 *     summary: Renommer une colonne
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: board
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               board: { type: string }
 *     responses:
 *       200: { description: Colonne renommée }
 *   delete:
 *     tags: [Lists]
 *     summary: Supprimer une colonne et ses tâches
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: board
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Colonne supprimée }
 */

router.get('/', boardAccess('observer'), async (req, res) => {
  const lists = await List.find({ board: req.board._id }).sort({ order: 1 });
  res.json(lists);
});

// Créer une liste
router.post('/', boardAccess('member'), async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Titre requis.' });
  const count = await List.countDocuments({ board: req.board._id });
  const list = await List.create({ board: req.board._id, title, order: count });
  res.status(201).json(list);
});

// Renommer une liste 
router.put('/:id', boardAccess('member'), async (req, res) => {
  const list = await List.findOneAndUpdate(
    { _id: req.params.id, board: req.board._id },
    { title: req.body.title },
    { new: true }
  );
  if (!list) return res.status(404).json({ message: 'Liste introuvable.' });
  res.json(list);
});

// Réordonner les listes 
router.put('/reorder', boardAccess('member'), async (req, res) => {
  const { orderedIds } = req.body;
  await Promise.all(
    (orderedIds || []).map((id, index) =>
      List.updateOne({ _id: id, board: req.board._id }, { order: index })
    )
  );
  res.json({ message: 'Ordre mis à jour.' });
});

// Supprimer une liste (et ses tâches) 
router.delete('/:id', boardAccess('admin'), async (req, res) => {
  const list = await List.findOneAndDelete({ _id: req.params.id, board: req.board._id });
  if (!list) return res.status(404).json({ message: 'Liste introuvable.' });
  await Task.deleteMany({ list: list._id });
  res.json({ message: 'Liste supprimée.' });
});

module.exports = router;