var express = require('express');
var router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Santé de l'API
 *     description: Vérifie que le serveur Express répond.
 *     responses:
 *       200:
 *         description: API opérationnelle
 */
router.get('/', function(req, res, next) {
  res.json({ message: 'API Tasky opérationnelle' });
});

module.exports = router;