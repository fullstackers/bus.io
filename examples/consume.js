var ok = require('assert').equal;

var bus = require('./..')(8080);

bus.on('say', function (message) {
  bus.message().i('server').did('consumed').what('your message').to(message.data.actor);
  message.consume(); 
});

setTimeout(function () {
  var client = require('socket.io-client')('http://localhost:8080');
  client.on('connect', function () {
    client.emit('say','hello');
  });
  client.on('consumed', function (who, what) {
    console.log(who + ' consumed ' + what);
    ok(who, 'server');
    ok(what, 'your message');
    process.exit();
  });
},1000);
