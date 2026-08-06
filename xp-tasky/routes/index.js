var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.json({ message: 'API Tasky opérationnelle' });
});

module.exports = router;