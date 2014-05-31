var bus = require('./..')();
bus.listen(8080);
bus.on('say', function (message) {
  message.deliver(); 
});

setTimeout(function () {
  var client = require('socket.io-client')('http://localhost:8080');
  client.on('connect', function () {
    client.once('say', function (who, what) {
      console.log(who + ' said ' + what);
      process.exit();
    });
    client.emit('say','hello');
  });
},1000);
