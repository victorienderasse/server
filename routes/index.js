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
  res.send('ok');
  
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
  if(!req.session.userID){
    res.redirect('/');
  }else{
    res.render('display', {userID: req.session.userID});
  }
});

router.get('/admin', function(req,res){
  res.render('admin', {});
});

router.get('/multiLive', function(req,res){
  if(!req.session.userID){
    res.redirect('/');
  }else{
    res.render('multiLive', {userID: req.session.userID});
  }
});

router.get('/user', function(req,res){
  console.log('user post');
  if(!req.session.userID){
    res.redirect('/');
  }else{
    res.render('user', {userID: req.session.userID});
  }
});

router.get('/addCamera', function(req,res){
  if(!req.session.userID){
    res.redirect('/');
  }else{
    res.render('addCamera', {userID: req.session.userID});
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

router.get('/noPage', function(req,res){
  res.render('noPage');
});

module.exports = router;
