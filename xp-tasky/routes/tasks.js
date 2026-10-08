const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const List = require('../models/List');
const Category = require('../models/Category');
const requireAuth = require('../middlewares/auth');
const boardAccess = require('../middlewares/board-access');
var categoriesRouter = require('./categories');

router.use(requireAuth);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Récupérer les tâches d'un tableau
 *     description: Retourne la liste de toutes les tâches associées à un tableau spécifique (nécessite d'être observateur minimum).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *               name: board
 *               required: true
 *               schema:
 *                 type: string
 *               description: ID du tableau
 *     responses:
 *       200:
 *         description: Liste des tâches récupérée avec succès.
 *       403:
 *         description: Accès refusé.
 *       500:
 *         description: Erreur serveur.
 */
router.get('/', boardAccess('observer'), async (req, res) => {
  const tasks = await Task.find({ board: req.board._id }).sort({ order: 1 });
  res.json(tasks);
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Créer une nouvelle tâche
 *     description: Crée une tâche et l'ajoute automatiquement dans la première liste du tableau (colonne 'À faire').
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: board
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du tableau
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Refondre la landing page
 *               description:
 *                 type: string
 *                 example: Mettre à jour le design avec la palette SaaS
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tâche créée avec succès.
 *       400:
 *         description: Titre requis ou aucune liste disponible.
 *       500:
 *         description: Erreur serveur.
 */
router.post('/', boardAccess('member'), async (req, res) => {
  try {
    const { title, dueDate, description, categories } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Titre requis.' });
    }

    const firstList = await List.findOne({ board: req.board._id }).sort({ order: 1 });
    if (!firstList) {
      return res.status(400).json({ message: 'Aucune liste disponible sur ce tableau.' });
    }

    let validCategoryIds = [];
    if (Array.isArray(categories) && categories.length > 0) {
      const found = await Category.find({ _id: { $in: categories }, board: req.board._id });
      validCategoryIds = found.map((c) => c._id);
    }

    const count = await Task.countDocuments({ list: firstList._id });
    const task = await Task.create({
      title: title.trim(),
      description: description || '',
      dueDate: dueDate || null,
      board: req.board._id,
      list: firstList._id,
      order: count,
      createdBy: req.userId,
      categories: validCategoryIds,
    });

    res.status(201).json(task);
  } catch (err) {
    console.error('[Create Task Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/**
 * @swagger
 * /api/tasks/{id}/move:
 *   put:
 *     summary: Déplacer une tâche (Kanban Drag & Drop)
 *     description: Met à jour la position d'une tâche (changement de colonne/liste ou réorganisation de l'ordre).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la tâche
 *       - in: query
 *         name: board
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du tableau
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - list
 *               - order
 *             properties:
 *               list:
 *                 type: string
 *                 example: 60c72b2f9b1d8b2e88a3f123
 *               order:
 *                 type: number
 *                 example: 1
 *     responses:
 *       200:
 *         description: Tâche déplacée avec succès.
 *       404:
 *         description: Tâche introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.put('/:id/move', boardAccess('member'), async (req, res) => {
  const { list, order } = req.body;
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, board: req.board._id },
    { list, order },
    { new: true }
  );
  if (!task) return res.status(404).json({ message: 'Tâche introuvable.' });
  res.json(task);
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Supprimer une tâche
 *     description: Supprime définitivement une tâche d'un tableau.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la tâche
 *       - in: query
 *         name: board
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du tableau
 *     responses:
 *       200:
 *         description: Tâche supprimée avec succès.
 *       404:
 *         description: Tâche introuvable.
 *       500:
 *         description: Erreur serveur.
 */
router.delete('/:id', boardAccess('member'), async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, board: req.board._id });
  if (!task) return res.status(404).json({ message: 'Tâche introuvable.' });
  res.json({ message: 'Tâche supprimée.' });
});

module.exports = router;