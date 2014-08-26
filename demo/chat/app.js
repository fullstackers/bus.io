/*
 * Use Cluster to fork this process, each process is an app instance.
 */

var cluster = require('cluster'), cpus = require('os').cpus().length;

if (cluster.isMaster) {
  for (var i=0; i<cpus; i++) {
    cluster.fork();
  }
  cluster.on('exit', function () {
    cluster.fork();
  });
  return;
}

/*
 * We are a child process now
 */

var debug = require('debug')('chat');

/*
 * Get Express up and running
 */

var express = require('express');
var expressSession = require('express-session');
var session = require('bus.io-session')({key:'bus.io.chat.demo'});

var app = express();
app.use(expressSession(session.config));
app.use(express.static(__dirname + '/public/'));

/*
 * Create a Server to attach our Express app
 */

var server = require('http').Server(app).listen(process.env.PORT || 3000);

/*
 * Get a Bus and using our Server
 */

var bus = require('bus.io')(server);
bus.addListener('error', function () {
  console.error(Array.prototype.slice.call(arguments));
});

/*
 * Hook up our express session to socket.io
 */

bus.use(session);

/*
 * We want our socket to receive messages when sent to everyone
 */

bus.socket(function (sock) {
  bus.alias(sock, 'everyone');
});

/*
 * We want our socket to trigger a "left" message when disconnected
 */

bus.socket(function (sock) {
  sock.on('disconnect', function () {
    bus.deliver({
      actor:sock.handshake.session.name,
      action:'left',
      target:'everyone'
    })
  });
});

/*
 * For all messages we will set the message actor to either the socket.name or 
 * socket.id. We are handling this message before it gets on the Bus.
 */

bus.in(function (msg, sock, next) {
  msg.actor(sock.handshake.session.name || sock.id);
  next();
});

/*
 * When we receive a "set name" event from the socket store that on the socket
 * and deliver() the message to the Exchange.  We are handling this message 
 * before it gets on the Bus.
 */

bus.in('set name', function (msg, sock, next) {
  if (msg.content().length && msg.content().length > 32) {
    msg.content(msg.content().slice(0,32));
  }
  sock.handshake.session.name = msg.content();
  sock.handshake.session.save(function (err) {
    debug('set name session save %s', err);
    if (err) return next(err);
    next();
  });
});

/*
 * When we receive a "post" event from the socket, cap the content length to
 * 128 characters.  We are handling this message before it gets on the Bus.
 */

bus.in('post', function (msg, sock) {
  msg.target(msg.content().pop());
  if (msg.content().length && msg.content().length > 128) {
    msg.content(msg.content().slice(0,125)+'...');
  }
  msg.deliver();
});

/*
 * This will capture errors so we can handle them accordingly
 */

bus.in(function (err, msg, sock, next) {
  console.error(err);
  next();
});

/*
 * Consume the message and send to everyone that you joined
 */

bus.on('set name', function (msg) {
  msg.consume().deliver('everyone');
});

/*
 * Before we deliver the "set name" event to the socekt,  alias the socket to 
 * the "name" if we are the actor. We are handling this message after it left 
 * the bus and on its way to the socket.
 */

bus.out('set name', function (msg, sock, next) {
  if (sock.handshake.session.name === msg.actor()) {
    bus.alias(sock, msg.content());
  }
  next();
});
