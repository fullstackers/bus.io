var ok = require('assert').equal;
var bus = require('./..')(3000);

bus.socket(function (socket, bus) {
  bus.alias(socket, 'zion');
});

bus.target(function (socket, params, cb) {
  cb(null, params.pop());
});

bus.in(function (message, socket, next) {
  message.content(message.content() + '!!!');
  next();
});

bus.on('shout', function (message) {
  message.respond(message.content() + '!!!');
});

bus.out(function (message, socket, next) {
  message.data.content[0] = message.data.content[0].toUpperCase();
  next();
});

setTimeout(function () {

  var socket = require('bus.io-client')('http://localhost:3000');
  socket.on('connect', function () {
    socket.emit('shout', 'hello', 'zion');
  });
  socket.on('shout', function (msg) {
    console.log(msg.actor() + ' shout ' + msg.content());
    ok(msg.actor(),'zion');
    ok(msg.content(),'hello!!!!!!');
    process.exit();
  });

}, 1000);
