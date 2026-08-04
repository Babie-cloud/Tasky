const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const requireAuth = require('../middlewares/auth');
const boardAccess = require('../middlewares/board-access');

router.use(requireAuth);

// Récupérer toutes les tâches d'un board (?board=<id>)
router.get('/', boardAccess('observer'), async (req, res) => {
  const tasks = await Task.find({ board: req.board._id }).sort({ order: 1 });
  res.json(tasks);
});

// Créer une tâche (body: { board, list, title, description?, dueDate? })
router.post('/', boardAccess('member'), async (req, res) => {
  const { title, list, dueDate, description } = req.body;
  if (!title || !list) return res.status(400).json({ message: 'Titre et liste requis.' });

  const count = await Task.countDocuments({ list });
  const task = await Task.create({
    title,
    description: description || '',
    dueDate: dueDate || null,
    board: req.board._id,
    list,
    order: count,
    createdBy: req.userId,
  });
  res.status(201).json(task);
});

// Modifier une tâche : titre, description, dueDate, assignedTo... (body doit contenir 'board')
router.put('/:id', boardAccess('member'), async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, board: req.board._id },
    req.body,
    { new: true }
  );
  if (!task) return res.status(404).json({ message: 'Tâche introuvable.' });
  res.json(task);
});

// Déplacer une tâche entre listes / positions (drag & drop) (body: { board, list, order })
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

// Supprimer une tâche (?board=<id>)
router.delete('/:id', boardAccess('member'), async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, board: req.board._id });
  if (!task) return res.status(404).json({ message: 'Tâche introuvable.' });
  res.json({ message: 'Tâche supprimée.' });
});

module.exports = router;