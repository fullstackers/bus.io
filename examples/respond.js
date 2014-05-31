var bus = require('./..')();
bus.listen(8080);
bus.on('greet', function (message) {
  message.deliver(); 
  message.respond('I am fine');
});

setTimeout(function () {
  var client = require('socket.io-client')('http://localhost:8080');

  var i = 0;

  client.on('connect', function () {

    client.once('', function (who, what) {
      console.log(who + ':' + what);
      process.exit();
    });
    
    client.on('greet', function (who, what) {
      console.log(who + ':' + what);
      if (++i > 1) process.exit();
    });

    client.emit('greet','how are you?');
  });

},1000);
