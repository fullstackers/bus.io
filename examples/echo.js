var bus = require('./..')();
bus.listen(8080);
bus.on('echo', function (message) {
  message.deliver(); 
});

setTimeout(function () {
  var client = require('socket.io-client')('http://localhost:8080');
  client.on('connect', function () {
    client.once('echo', function (who, what) {
      console.log(who + ' echo ' + what);
      process.exit();
    });
    client.emit('echo','hello');
  });
},1000);
