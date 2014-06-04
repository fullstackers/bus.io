var bus = require('./..')(8080);
bus.on('say', function (message) {
  message.consume(); 
  this.message().i('server').did('consumed').what('your message').to(message.data.actor);
});

bus.on('consumed', function (message) {
  message.deliver();
});

setTimeout(function () {
  var client = require('socket.io-client')('http://localhost:8080');
  client.on('connect', function () {
    client.once('consumed', function (who, what) {
      console.log(who + ' consumed ' + what);
      process.exit();
    });
    client.emit('say','hello');
  });
},1000);
