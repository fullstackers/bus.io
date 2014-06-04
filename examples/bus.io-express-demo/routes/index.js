var express = require('express');
var router = express.Router();
var User = require('../lib/user');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Bus.IO and Express Demo', req:req });
});

router.get('/register', function (req, res) {
  res.render('register', {req:req});
});

router.get('/logout', function (req, res) {
  if (req.session.user) {
    req.session.destroy();
  }
  res.redirect('/');
});

router.post('/register', function (req, res, next) {
  // TODO use express-logical-routes :)
  if (!req.param('user')) return res.status(400).render('register', {req:req, message:'Missing username!'});
  if (!req.param('password')) return res.status(400).render('register', {req:req, message:'Missing password!'});
  if (!req.param('password1')) return res.status(400).render('register', {req:req, message:'Please reenter password!'});
  if (req.param('password') !== req.param('password1')) return res.status(400).render('register', {req:req, message:'Passwords do not match!'});
  User.get(req.param('user'), function (err, user) {
    if (err) return next(err);
    if (user) return res.status(403).render('register', { req: req, message: 'User already exists!' });
    new User(req.param('user'), req.param('password')).save(function (err, user) {
      if (err) return next(err);
      console.log('user', user);
      req.session.user = user;
      req.session.save();
      res.redirect('/');
    });
  });
});

router.get('/login', function (req, res) {
  res.render('login', {req:req});
});

router.post('/login', function (req, res, next) {
  if (!req.param('user')) return res.status(400).render('register', {req:req, message:'Missing username!'});
  if (!req.param('password')) return res.status(400).render('register', {req:req, message:'Missing password!'});
  User.get(req.param('user'), function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(404).render('login', {req:req, message:'User does not exist.'});
    console.log(user.password, req.param('password'));
    if (user.password !== req.param('password')) return res.status(401).render('login', {req:req, message: 'Password is invalid!'});
    req.session.user = user;
    req.session.save();
    res.redirect('/');
  });
});

module.exports = router;
