/*
 * Use Cluster to fork this process same number of times as we have cpus!
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

var app = require('express')();
app.get('/', function (req, res) {
  res.sendfile(__dirname+'/public/index.html');
});

/*
 * Create a Server to attach our Express app
 */

var server = require('http').Server(app).listen(process.env.PORT || 3000);

/*
 * Get a Bus and using our Server
 */

var bus = require('bus.io')(server);

/*
 * We want our socket to receive messages when sent to everyone
 */

bus.socket(function (socket, bus) {
  bus.alias(socket, 'everyone');
});

/*
 * For all messages we will set the message actor to either the socket.name or 
 * socket.id
 */

bus.in(function (message, socket, next) {
  message.actor(socket.name || socket.id);
  next();
});

/*
 * When we receive a "set name" event from the socket store that on the socket
 * and deliver() the message to the Exchange.
 */

bus.in('set name', function (message, socket) {
  socket.name = message.content();
  message.deliver();
});


/*
 * When we receive a "post" event from the socket, cap the content length to
 * 128 characters.
 */

bus.in('post', function (message, socket) {
  message.target(message.content().pop());
  if (message.content().length && message.content()[0].length > 128) {
    message.content(message.content().slice(0,125)+'...');
  }
  message.deliver();
});

/*
 * When the Bus finnaly gets the "post" message just deliver to the target.
 */

bus.on('post', function (message) {
  message.deliver();
});

/*
 * When the Bus finally gets the "set name" message just deliver to the target.
 */

bus.on('set name', function (message) {
  message.deliver();
});

/*
 * Before we deliver the "set name" event to the socekt,  alias the socket to 
 * the "name".
 */

bus.out('set name', function (message, socket, next) {
  bus.alias(socket, message.content());
  next();
});
