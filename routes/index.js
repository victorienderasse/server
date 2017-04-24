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

router.get('/user', function(req,res){
  var sess = req.session;
  if(!sess.userID){
    sess.userID = 1000;
  }
  res.render('user', {userID: sess.userID});
});

router.get('/addCamera', function(req,res){
  res.render('addCamera', {userID: req.query.userID});
});

router.get('/contact', function(req,res){
  res.render('contact', {});
});

router.get('/purchase', function(req,res){
  res.render('purchase', {});
});

router.use(function(req,res,next){
  res.redirect('/');
});

module.exports = router;
