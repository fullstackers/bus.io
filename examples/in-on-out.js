var bus = require('./..')(3000);

bus.in(function (message, socket, next) {
  message.data.content += '!!!'
  next();
});

bus.on('shout', function (message) {
  message.deliver();
});

bus.out(function (message, socket, next) {
  message.data.content[0] = message.data.content[0].toUpperCase();
  next();
});

setTimeout(function () {

  var socket = require('socket.io-client')('http://localhost:3000');
  socket.on('connect', function () {
    socket.emit('shout', 'hello');
  });
  socket.on('shout', function (who, what) {
    console.log(who + ' shout ' + what);
    process.exit();
  });

}, 1000);


