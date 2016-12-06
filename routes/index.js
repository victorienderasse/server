var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { name: 'Index' });
});

router.get('/display', function(req,res){
  res.render('display');
});

router.use(function(req,res,next){
  res.redirect('/');
});

module.exports = router;
