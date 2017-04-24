var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { name: 'Index' });
});

router.post('/display', function(req,res){
  var sess = req.session;
  if(!sess.email){
    res.redirect('/');
  }else{
    res.render('display', {userID: req.query.userID});
  }
});

router.get('/admin', function(req,res){
  res.render('admin', {});
});

router.post('/multiLive', function(req,res){
  var sess = req.session;
  if(!sess.email){
    res.redirect('/');
  }else{
    res.render('multiLive', {userID: req.query.userID});
  }
});

router.post('/user', function(req,res){
  var sess = req.session;
  if(!sess.email){
    res.redirect('/');
  }else{
    res.render('user', {userID: req.query.userID});
  }
});

router.post('/addCamera', function(req,res){
  var sess = req.session;
  if(!sess.email){
    res.redirect('/');
  }else{
    res.render('addCamera', {userID: req.query.userID});
  }
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
