var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { name: 'Index' });
});

router.get('/display', function(req,res,next){
  console.log(req.params.userID)
  res.render('display',{userID: req.params.userID});
});

module.exports = router;
