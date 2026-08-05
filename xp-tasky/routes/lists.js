const express = require('express');
const router = express.Router();
const List = require('../models/List');
const Task = require('../models/Task');
const requireAuth = require('../middlewares/auth');
const boardAccess = require('../middlewares/board-access');

router.use(requireAuth);

// Lister les listes d'un board
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