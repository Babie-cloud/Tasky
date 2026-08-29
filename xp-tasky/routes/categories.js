const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const requireAuth = require('../middlewares/auth');
const boardAccess = require('../middlewares/board-access');

router.use(requireAuth);

router.get('/', boardAccess('observer'), async (req, res) => {
  try {
    const categories = await Category.find({ board: req.board._id }).sort({ createdAt: 1 });
    res.json(categories);
  } catch (err) {
    console.error('[Get Categories Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});


router.post('/', boardAccess('admin'), async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nom de catégorie requis.' });
    }
    const category = await Category.create({
      name: name.trim(),
      color: color || '#2eb85c',
      board: req.board._id,
    });
    res.status(201).json(category);
  } catch (err) {
    console.error('[Create Category Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/:id', boardAccess('admin'), async (req, res) => {
  try {
    const { name, color } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (color !== undefined) updates.color = color;

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, board: req.board._id },
      updates,
      { new: true }
    );
    if (!category) return res.status(404).json({ message: 'Catégorie introuvable.' });
    res.json(category);
  } catch (err) {
    console.error('[Update Category Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/:id', boardAccess('admin'), async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, board: req.board._id });
    if (!category) return res.status(404).json({ message: 'Catégorie introuvable.' });

 
    const Task = require('../models/Task');
    await Task.updateMany({ board: req.board._id }, { $pull: { categories: category._id } });

    res.json({ message: 'Catégorie supprimée.' });
  } catch (err) {
    console.error('[Delete Category Error]:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;