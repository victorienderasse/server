var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { name: 'Index' });
});

router.get('/display', function(req,res){
  res.render('display', {userID: req.query.userID});
});

router.get('/admin', function(req,res){
  res.render('admin', {});
});

router.get('/multiLive', function(req,res){
  res.render('multiLive', {userID: req.query.userID});
});

router.use(function(req,res,next){
  res.redirect('/');
});

module.exports = router;
