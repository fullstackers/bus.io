var bus = require('./..')(3000);

bus.addListener('from socket', function (message, socket) {
  console.log('step 0 from socket', message.id, socket.id);
});

bus.in(function (message, socket, next) {
  console.log('step 1 in(*)');
  message.content(message.content().shift()+'!!!');
  next();
});

bus.in('shout', function (message, socket) {
  console.log('step 2 in(shout)');
  message.deliver();
});

bus.in('shout', function (message, socket, next) {
  console.log('should not see this output!!!!');
  next()
});

bus.on('shout', function (message) {
  console.log('step 3 on(shout)');
  message.deliver();
});

bus.addListener('from exchange', function (message, socket) {
  console.log('step 4 from exchange', message.id, socket.id);
});

bus.out(function (message, socket, next) {
  console.log('step 5 out(*)', typeof message, typeof socket, typeof next)
    message.content(message.content().toUpperCase());
  next();
});

bus.out('shout', function (message, socket, next) {
  console.log('step 6 out(shout)');
  // dont have to call deliver, we could call next, or vice versa.
  message.deliver();
});

bus.out('shout', function (message, socket, next) {
  console.log('should not see this output!!!!');
  next();
});

setTimeout(function () {

  var socket = require('socket.io-client')('http://localhost:3000');
  socket.on('connect', function () {
    socket.emit('shout', 'hello');
  });
  socket.on('shout', function (who, what) {
    console.log(who + ' shout ' + what);
    process.exit();
  });

}, 1000);


