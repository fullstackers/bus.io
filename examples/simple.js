var ok = require('assert').equal;

var bus = require('./..')(8080);

setTimeout(function () {

  var client = require('socket.io-client')('http://localhost:8080');
  client.on('connect', function () {
    client.once('echo', function (who, what) {
      console.log(who + ' says ' + what);
      ok(what,'hello');
      process.exit();
    });
    client.emit('echo','hello');
  });

}, 1000);
