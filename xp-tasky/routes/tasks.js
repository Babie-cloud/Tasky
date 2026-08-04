const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const requireAuth = require('../middlewares/auth');

router.use(requireAuth);

// Récupérer toutes les tâches de l'utilisateur connecté
router.get('/', async (req, res) => {
  const tasks = await Task.find({ user: req.userId }).sort({ createdAt: 1 });
  res.json(tasks);
});

// Créer une tâche
router.post('/', async (req, res) => {
  const { title, status } = req.body;
  if (!title) return res.status(400).json({ message: 'Le titre est requis.' });
  const task = await Task.create({ title, status: status || 'todo', user: req.userId });
  res.status(201).json(task);
});

// Modifier une tâche
router.put('/:id', async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    req.body,
    { new: true }
  );
  if (!task) return res.status(404).json({ message: 'Tâche introuvable.' });
  res.json(task);
});

// Supprimer une tâche
router.delete('/:id', async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!task) return res.status(404).json({ message: 'Tâche introuvable.' });
  res.json({ message: 'Tâche supprimée.' });
});

module.exports = router;