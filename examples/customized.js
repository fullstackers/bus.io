var bus = require('./..')();

/*
 * set a method to extrac the actor id from the socket
 */

bus.socketMessages().actor(function (socket, cb) {
  cb(null, 'Nathan');
});

/*
 * set a method to extract the target from the request
 */
bus.socketMessages().target(function (socket, params, cb) {
  // use the last argument in the emit from the client
  cb(null, params.pop());
});

/*
 * Lets handle the echo event
 */

bus.on('say', function (message) {
  message.respond('hi').deliver();
});

/*
 * Start up the server
 */

bus.listen(8080);

// do some client stuff

setTimeout(function () {
  var client = require('socket.io-client')('http://localhost:8080');
  client.on('connect', function () {
    client.on('say', function (who, what) {
      console.log(who + ' echo ' + what);
      process.exit();
    });
    client.emit('say','hello', 'Zion');
  });
},1000);
