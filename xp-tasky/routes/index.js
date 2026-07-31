var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.json({ message: 'API Lotel opérationnelle' });
});

module.exports = router;