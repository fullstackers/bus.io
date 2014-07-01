var ok = require('assert').equal;

var bus = require('./..')(8080);
bus.on('greet', function (message) {
  message.deliver(); 
  message.respond('I am fine');
});

setTimeout(function () {
  var client = require('bus.io-client')('http://localhost:8080');

  var i = 0, msgs = [];

  client.on('connect', function () {
    
    client.on('greet', function (msg) {
      console.log(msg.content());
      msgs.push(msg.content());
      if (++i > 1) {
        ok(msgs[0],'how are you?');
        ok(msgs[1],'I am fine');
        process.exit();
      }
    });

    client.emit('greet','how are you?');
  });

},1000);
