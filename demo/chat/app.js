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

/*
 * Get Express up and running
 */

var express = require('express');
var expressSession = require('express-session');
var session = require('bus.io-session')();

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

bus.socket(function (socket) {
  bus.alias(socket, 'everyone');
});

/*
 * We want our socket to trigger a "left" message when disconnected
 */

bus.socket(function (socket) {
  socket.on('disconnect', function () {
    bus.message().i(socket.handshake.session.name).did('left').what('here').to('everyone');
  });
});

/*
 * For all messages we will set the message actor to either the socket.name or 
 * socket.id. We are handling this message before it gets on the Bus.
 */

bus.in(function (message, socket, next) {
  message.actor(socket.handshake.session.name || socket.id);
  next();
});

/*
 * When we receive a "set name" event from the socket store that on the socket
 * and deliver() the message to the Exchange.  We are handling this message 
 * before it gets on the Bus.
 */

bus.in('set name', function (message, socket) {
  if (message.content().length && message.content().length > 32) {
    message.content(message.content().slice(0,32));
  }
  socket.handshake.session.name = message.content();
  socket.handshake.session.save();
  message.deliver();
});

/*
 * Consume the message and send to everyone that you joined
 */

bus.on('set name', function (message) {
  message.consume().deliver('everyone');
});


/*
 * When we receive a "post" event from the socket, cap the content length to
 * 128 characters.  We are handling this message before it gets on the Bus.
 */

bus.in('post', function (message, socket) {
  message.target(message.content().pop());
  if (message.content().length && message.content().length > 128) {
    message.content(message.content().slice(0,125)+'...');
  }
  message.deliver();
});

/*
 * Before we deliver the "set name" event to the socekt,  alias the socket to 
 * the "name" if we are the actor. We are handling this message after it left 
 * the bus and on its way to the socket.
 */

bus.out('set name', function (message, socket, next) {
  if (socket.handshake.session.name === message.actor()) {
    bus.alias(socket, message.content());
  }
  next();
});
