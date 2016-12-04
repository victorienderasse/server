var express = require('express');
var router = express.Router();
var sess;


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { name: 'Index' });
});

router.get('/display', function(req,res){
  sess = req.session;
  sess.userID = req.query.userID;
  res.render('display',{userID: req.query.userID});
});

module.exports = router;
