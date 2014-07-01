var ok = require('assert').equal;

var bus = require('./..')(8080);

bus.on('say', function (message) {
  bus.message().i('server').did('consumed').what('your message').to(message.data.actor);
  message.consume(); 
});

setTimeout(function () {
  var client = require('bus.io-client')('http://localhost:8080');
  client.on('connect', function () {
    client.message().action('say').content('hello').deliver();
  });
  client.on('consumed', function (msg) {
    console.log(msg.actor() + ' consumed ' + msg.content());
    ok(msg.actor(), 'server');
    ok(msg.content(), 'your message');
    process.exit();
  });
},1000);
