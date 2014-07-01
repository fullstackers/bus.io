var ok = require('assert').equal;
var bus = require('./..')(8080);

setTimeout(function () {
  var client = require('bus.io-client')('http://localhost:8080');
  client.on('connect', function () {
    client.once('echo', function (msg) {
      console.log(msg.action() + ' says ' + msg.content());
      ok(msg.content(),'hello');
      process.exit();
    });
    client.message().action('echo').content('hello').deliver();
  });
},1000);
