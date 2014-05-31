var bus = require('./..')();
bus.listen(8080);
bus.on('say', function (message) {
  message.deliver(); 
});

setTimeout(function () {
  var client = require('socket.io-client')('http://localhost:8080');
  client.on('connect', function () {
    client.emit('say','Hello');
  });
  client.on('say', function (message) {
    console.log(message);
    process.exit();
  });


},1000);
