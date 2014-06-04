var cluster = require('cluster')
  , cpus = require('os').cpus().length || 1;

if (cluster.isMaster) {
  for (var i=0; i<cpus; i++) {
    cluster.fork();
    cluster.on('exit', function (worker, code, signal) {
      if (code === 1) return;
      console.log('worker ' + worker.process.pid + ' died with code ' + code + ' and signal ' + signal);
      cluster.fork();
    });
  }
  return;
}

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var User = require('./lib/user');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

var config = {
  port: 3000,
  session: {
    secret: 'some secret',
    key: 'some.sid',
    store: new session.MemoryStore()
  }
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session(config.session));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
});

app.use('/', routes);
app.use('/users', users);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var server = require('http').createServer(app).listen(config.port, function (err) {
  if (err) {
    console.error(err);
    return process.exit(1);
  }
  console.log('demo app running on ' + config.port);
});

var io = require('socket.io')(server);
io.set('authorization', function (data, authorization) {
  if (data.headers.cookie) {
    var cookies = cookie.parse(data.headers.cookie);
    data.sessionID = require('connect').utils.parseSignedCookie(cookies[config.session.key], config.session.secret);
    data.sessionStore = config.session.store;
    data.sessionStore.get(data.sessionID, function (err, session) {
      if (err) return next(err, false);
      if (!session) return next(new Error('Invalid session'), false);
      data.session = new session.Session(data, session); 
      next(null, true);
    });
  }
  else {
    next(new Error('Missing Cookies'), false);
  }
});

var bus = require('bus.io')(server);

bus.actor(function (socket, cb) {
  if (socket.handshake.session.user) {
    cb(null, socket.handshake.session.user.name);
  }
  else {
    cb(null, socket.id);
  }
});

bus.target(function (socket, params, cb) {
  if (params.length > 1) {
    cb(null, params.pop());
  }
  else {
    bus.actor(socket, cb);
  }
});

bus.out(function (message, socket, next) {
  switch (message.data.action) {
    case 'post': {
      if (message.data.content[0].length > 128) {
        message.data.content[0] = message.data.content[0].slice(0,125) + '...';
      }
    } break;
  }
  next();
});

bus.on('post', function (message) {
  if (message.data.actor === message.data.target) {
    User.get(message.data.actor, function (err, user) {
      if (user) message.deliver(user.followers);
    });
  }
  else {
    message.deliver();
  }
});

bus.on('follow', function (message) {
  User.get(message.data.actor, function (err, actor) {
    if (!actor) return;
    User.get(message.data.target, function (err, target) {
      if (!target) return;
      if (actor.following.indexOf(target.name) < 0) {
        actor.following.push(target.name);
      }
      if (target.followers.indexOf(actor.name) < 0) {
        target.followers.push(actor.name);
      }
      actor.save(function (err) {
        if (!err) message.deliver(actor.name);
      });
      target.save(function (err) {
        if (!err) message.deliver(target.name);
      });
    });
  })
});

module.exports = app;
