var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { name: 'Index' });
});

router.get('/display', function(req,res){
 var userID = req.query.userID;
  res.render('display',{userID: userID});
});

module.exports = router;
