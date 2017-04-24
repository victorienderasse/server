var express = require('express');
var router = express.Router();
var sess, connect, hash;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { name: 'Index' });
});

router.post('/login', function(req,res){
  console.log('login event');
  connect = req.connection;
  hash = req.passHash;
  sess = req.session;
  
  const getPassword = 'SELECT * FROM user WHERE email = "'+req.body.email+'"';
  connect.query(getPassword,function(err,rows){
    if (err)throw err;
    if (rows.length>0){
      if (hash.verify(req.body.password, rows[0].password)){
        sess.email = req.body.email;
        res.redirect('display');
      }
    }else{
      res.redirect('/');
    }
  })
});

router.post('/display', function(req,res){
  sess = req.session;
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
  sess = req.session;
  if(!sess.email){
    res.redirect('/');
  }else{
    res.render('multiLive', {userID: req.query.userID});
  }
});

router.post('/user', function(req,res){
  sess = req.session;
  if(!sess.email){
    res.redirect('/');
  }else{
    res.render('user', {userID: req.query.userID});
  }
});

router.post('/addCamera', function(req,res){
  sess = req.session;
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
