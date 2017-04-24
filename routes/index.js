var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var connection = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '221193m',
  database : 'TFE'
});
var passHash = require('password-hash');
var sess;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { name: 'Index' });
});

router.post('/login', function(req,res){
  
  const getPassword = 'SELECT * FROM user WHERE email = "'+req.body.email+'"';
  connection.query(getPassword,function(err,rows){
    if (err)throw err;
    if (rows.length>0){
      if (passHash.verify(req.body.password, rows[0].password)){
        req.session.userID = rows[0].userID;
        console.log('userID: '+req.session.userID);
        res.redirect(200,'/display',{userID:req.session.userID});
        console.log('redirect to display end');
      }
    }else{
      res.redirect('/');
    }
  })
});

router.get('/display', function(req,res){
  console.log('post display');
  console.log('userID: '+req.session.userID);
  if(!req.session.userID){
    res.redirect('/');
  }else{
    console.log(' render display');
    res.render('display', {userID: req.session.userID});
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
