var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { name: 'Index' });
});

router.post('/display', function(req,res,next){
  console.log(req.query.userID)
  res.render('display',{userID: req.query.userID});
});

module.exports = router;
