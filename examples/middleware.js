var ok = require('assert').equal;

var bus = require('./..')(8080);

bus.in(function (message, socket, next) {
  console.log('1');
  message.actor('1st graders');
  next();
});

bus.on(function (message, next) {
  console.log('2');
  message.content(message.content() + 'A');
  next();
});

bus.on('test', function (message, next) {
  console.log('3');
  message.content(message.content() + 'B');
  next();
});

bus.on('test', function (message) {
  console.log('4');
  message.content(message.content() + 'C');
  message.deliver();
});

bus.out('test', function (message, socket, next) {
  console.log('5');
  message.content(message.content() + '\'s');
  next();
});

setTimeout(function () {
  var client = require('socket.io-client')('http://localhost:8080');
  client.on('connect', function () {
    client.emit('test', '');
  });
  client.on('test', function (who, what) {
    console.log('test', who + ' knows their ' + what);
    ok(who, '1st graders');
    ok(what, 'ABC\'s');
    process.exit();
  })

}, 1000);
