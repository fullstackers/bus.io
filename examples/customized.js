var ok = require('assert').equal;

var bus = require('./..')();

/*
 * set a method to extrac the actor id from the socket
 */

bus.actor(function (socket, cb) {
  cb(null, 'Nathan');
});

/*
 * set a method to extract the target from the request
 */

bus.target(function (socket, params, cb) {
  // use the last argument in the emit from the client
  cb(null, params.pop());
});

/*
 * Lets handle the event
 */

bus.on('say', function (message) {
  message.respond('hi');
});

/*
 * Start up the server
 */

bus.listen(8080);

// do some client stuff

setTimeout(function () {
  var client = require('bus.io-client')('http://localhost:8080');
  client.on('connect', function () {
    client.on('say', function (msg) {
      console.log(msg.actor() + ' echo ' + msg.content());
      ok(msg.actor(),'Zion');
      ok(msg.content(),'hi');
      process.exit();
    });
    //using emit instead of message()
    client.emit('say','hello', 'Zion');
  });
},1000);
