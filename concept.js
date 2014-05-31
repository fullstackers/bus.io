var io = require('socket.io')()
  , socketMessages = require('socket-messages').make()
  , messageExchange = require('message-exchange').make()
  ;

messageExchange.handler.on('say', function (message, exchange) {
  exchange.channel(message.target).publish(message);
});

messageExchange.on('message', function (message) {
  this.publish(message);
});

socketMessages.exchange(messageExchange).action('say').attach(io);

io.on('connection', function (socket) {
  function handle (message) {
    console.log('handle message', message);
    socket.emit.apply(socket, [message.action, message.actor].concat(message.content));
  }
  messageExchange.channel(socket.id).on('message', handle);
  socket.on('disconnect', function () {
    console.log('on disconnect');
    messageExchange.channel(socket.id).removeListener('message', handle);
  });
});

io.listen(3000);

setTimeout(function () {

  var i = require('socket.io-client')('http://localhost:3000/');
  i.on('connect', function () {
    i.on('say', function (who, what) {
      console.log(who + ' said "' + what + '" to me');
      process.exit();
    });
    i.emit('say', 'hello');
  });

},1000);

