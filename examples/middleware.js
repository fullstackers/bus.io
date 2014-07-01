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
  var client = require('bus.io-client')('http://localhost:8080');
  client.on('connect', function () {
    client.emit('test', '');
  });
  client.on('test', function (msg) {
    console.log('test', msg.actor() + ' knows their ' + msg.content());
    ok(msg.actor(), '1st graders');
    ok(msg.content(), 'ABC\'s');
    process.exit();
  })

}, 1000);
