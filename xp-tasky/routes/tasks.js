const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const List = require('../models/List');
const Category = require('../models/Category');
const requireAuth = require('../middlewares/auth');
const boardAccess = require('../middlewares/board-access');
var categoriesRouter = require('./categories');

router.use(requireAuth);

router.get('/', boardAccess('observer'), async (req, res) => {
  const tasks = await Task.find({ board: req.board._id }).sort({ order: 1 });
  res.json(tasks);
});

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

router.put('/:id', boardAccess('member'), async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, board: req.board._id },
    req.body,
    { new: true }
  );
  if (!task) return res.status(404).json({ message: 'Tâche introuvable.' });
  res.json(task);
});

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

router.delete('/:id', boardAccess('member'), async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, board: req.board._id });
  if (!task) return res.status(404).json({ message: 'Tâche introuvable.' });
  res.json({ message: 'Tâche supprimée.' });
});

module.exports = router;
