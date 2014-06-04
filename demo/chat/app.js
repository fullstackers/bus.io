var app = require('express')();
app.get('/', function (req, res) {
  res.sendfile(__dirname+'/public/index.html');
});

var server = require('http').Server(app).listen(3000);

// we want to use the "socket.name" or the "socket.id" as the actor
var bus = require('bus.io')(server);
bus.actor(function (socket, cb) {
  cb(null, socket.name || socket.id);
});

// we want to use the last argument as the "target" only if we have more than one argument
bus.target(function (socket, params, cb) {
  if (params.length > 1) {
    cb(null, params.pop());
  }
  else {
    cb(null, socket.name || socket.id)
  }
});

// when we receive connection, we want to alias the socket to everyone
bus.socket(function (socket, bus) {
  bus.alias(socket, 'everyone');
});

// when we receive a message from the socket we want chop it down to 128 characters
bus.in(function (message, socket, next) {
  var content = message.data.content[0];
  if (content && content.length > 128) {
    message.data.content[0] = content.slice(0,125)+'...';
  }
  next();
});

// when we get a post message we want to deliver
bus.on('post', function (message) {
  message.deliver();
});

// when we get a "set user" we want to deliver it
bus.on('set user', function (message) {
  message.deliver();
});

// when we receive the "set user" message we want to alias the socket to the user
bus.out(function (message, socket, next) {
  switch(message.data.action) {
    case 'set user': {
      var name = message.data.content[0];
      bus.alias(socket, name);
      socket.name = name;
    } break;
  }
  next();
});

/** 
 * TODO Instead of using actor I would like to use a middlware function
 */

/*
bus.in(function (message, socket, next) {
  message.actor(socket.user);
  next();
})
*/

/**
 * TODO Instead of using target I would like to use a middleware function
 */

/*
bus.in(function (message, socket, next) {
  message.target(message.content().pop());
  next();
});
*/
