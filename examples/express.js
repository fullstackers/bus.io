/*
 * Using clsuter to scale the app on X number of CPUS
 */
var cluster = require('cluster')
  , cpus = require('os').cpus().length || 1;

if (cluster.isMaster) {
  for (var i=0; i<cpus; i++) {
    cluster.fork();
  }
  return;
}

/*
 * Everything after this line is a worker process
 */

/*
 * Our user model
 */

function User (name, password) {
  this.name = name;
  this.password = password;
  this.following = [];
  this.followers = [];
}

/*
 * Where our data lives (redis)
 */

var store = require('redis').createClient();

/*
 * Configuration for express and our server
 */

var config = {
  port: 3000,
  session: {
    secret: 'some secret',
    key: 'some.sid',
    store: new express.session.MemoryStore()
  }
};

/*
 * Set up our express app
 */

var express = require('express')
  , app = express();
app.set('port', config.port);
app.use(express.cookieParser());
app.use(express.session(config.session));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});
app.post('/register', function (req, res) {
  store.get(req.param('user'), function (err, user) {
    if (err) return res.status(500).json(err);
    if (user) return res.status(403).json(new Error('User already exists.'));
    store.set(req.param('user'), new User(req.param('user'), req.param('password')), function (err, res) {
      if (err) return res.status(500).json(err);
      res.status(201).json(res);
    });
  });
});
app.post('/login', function (req, res) {
  store.get(req.param('user'), function (err, user) {
    if (err) return res.status(500).json(err);
    if (!user) return res.status(404).json(new Error('User does not exist.'));
    if (user.password !== req.param('password')) return res.status(401).json(new Error('Password is invalid'));
    req.session.user = user;
    res.status(200).json(user);
  });
});

/*
 * Create our http server that will run our express app
 */

var server = require('http').createServer(app)

/*
 * Set up socket.io to listen our server and share the express session
 */

var io = require('socket.io')(server);
io.set('authorization', function (data, authorization) {
  if (data.headers.cookie) {
    var cookies = cookie.parse(data.headers.cookie);
    data.sessionID = require('connect').utils.parseSignedCookie(cookies[config.session.key], config.session.secret);
    data.sessionStore = config.session.store;
    data.sessionStore.get(data.sessionID, function (err, session) {
      if (err) return next(err, false);
      if (!session) return next(new Error('Invalid session'), false);
      data.session = new express.session.Session(data, session); 
      next(null, true);
    });
  }
  else {
    next(new Error('Missing Cookies'), false);
  }
});

/*
 * Setup bus.io it will use the session user.name as the actor, and the last parameter from each request as the target
 */

var bus = require('./..')(io);
bus.actor(function (socket, cb) {
  cb(null, socket.handshake.data.session.user.name);
});
bus.target(function (socket, params, cb) {
  cb(null, params.pop() || socket.handshake.data.session.user.name);
});
bus.on('follow', function (message) {

  // get both the actor and the tarvet
  store.get(message.data.actor, function (err, actor) {
    if (err) return message.respond(err);
    if (!actor) return message.respond(new Error('User does not exist.'));
    store.get(message.data.target, function (err, target) {
      if (err) return message.respond(err);
      if (!target) return message.respond(new Error('User does not exist.'));

      // update the models
      actor.following.push(target.name);
      target.followers.push(actor.name);
      
      // save the messages
      store.set(actor.name, actor, function (err, res) {
        if (err) return message.respond(err);
        if (!res) return message.respond(res);
        store.set(target.name, target, function (err, res) {
          if (err) return message.respond(err);
          if (!res) return message.respond(res);

          // deliver the message
          message.deliver(actor.name, target.name);
        });
      });
    });
  });
});
bus.on('post', function (message) {
  store.get(message.data.actor, function (err, actor) {
    if (err) return message.respond(err);
    if (!actor) return message.respond(new Error('User does not exist.'));
    
    // deliver the post to their followers
    message.deliver(actor.followers);
  });
});

/*
 * Start up the server
 */

server.listen(config.port, function (err) {
  if (err) {
    console.error(err);
    return process.exit(1);
  }
  console.log('example listeing on port ' + config.port);
});
