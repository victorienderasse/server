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


/* GET home page. */
router.get('/', function(req, res) {
  if(req.session.userID){
    res.redirect('/display');
  }else{
    res.render('index');
  }
});

router.post('/login', function(req,res){
  
  req.session.userID = req.body.userID;
  res.redirect('/display');
  /*
  const getPassword = 'SELECT * FROM user WHERE email = "'+req.body.email+'"';
  connection.query(getPassword,function(err,rows){
    if (err)throw err;
    if (rows.length>0){
      if (passHash.verify(req.body.password, rows[0].password)){
        req.session.userID = rows[0].userID;
        console.log('userID: '+req.session.userID);
        res.redirect('/display');
      }
    }else{
      res.redirect('/');
    }
  });
  */
});

router.get('/logout', function(req,res){
  req.session.destroy();
  res.redirect('/');
});

router.post('/signin', function(req,res){

  console.log('signin post');
  console.log('email: '+req.body.email);
  req.session.userID = 1;

  /*
  console.log('signin event');
  var password = passHash.generate(req.body.password);
  const checkEmail = 'SELECT email FROM user WHERE email = "'+req.body.email+'"';
  connection.query(checkEmail, function(err, rows){
    if (err)throw err;
    if (rows.length>0){
      res.redirect('/');
    }else{
      const signin = 'INSERT INTO user SET name = "'+req.body.name+'", email = "'+req.body.email+'", password = "'+password+'"';
      connection.query(signin, function(err){
        if (err)throw err;
        const getUserID = 'SELECT userID FROM user WHERE email = "'+req.body.email+'"';
        connection.query(getUserID, function(err,rows){
          if (err)throw err;
          req.session.userID = rows[0].userID;
          res.redirect('/display');
        });
      });
    }
  });
  */
  
  
  
});

router.get('/display', function(req,res){
  console.log('display');
  if(!req.session.userID){
    console.log('display error userID');
    res.redirect('/');
  }else{
    console.log('display render ok');
    res.render('display', {userID: req.session.userID});
  }
});

router.get('/admin', function(req,res){
  res.render('admin', {});
});

router.post('/multiLive', function(req,res){
  if(!req.session.userID){
    res.redirect('/');
  }else{
    res.render('multiLive', {userID: req.query.userID});
  }
});

router.post('/user', function(req,res){
  if(!req.session.userID){
    res.redirect('/');
  }else{
    res.render('user', {userID: req.query.userID});
  }
});

router.post('/addCamera', function(req,res){
  if(!req.session.userID){
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
  res.redirect('/error');
});

router.get('/error', function(req,res){
  res.render('error');
});

module.exports = router;
