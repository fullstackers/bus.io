var cluster = require('cluster');

if (cluster.isMaster) {

  var processesToFork = 400;  // you may need to change this
  /**
   * This is the number of process my hackintosh with an already full
   * load of apps ran about 498.  I have 24 gigs of ram and an 3.5 i7
   *
   * TODO figure out latency
   */
  console.log('starting bus...');
  var bus = require('./..')(3000);
  bus.socket(function (socket, bus) { bus.alias(socket, 'everyone'); });
  bus.target(function (message, params, cb) { cb(null, params.pop()); });
  bus.on('shout', function (message) {
    message.deliver();
  });
  for (var i=0; i<processesToFork; i++) {
    console.log('forking client... ('+i+')');
    cluster.fork(); 
  }
  cluster.on('exit', function () {
    if (--processesToFork <= 0)
      process.exit();
  });
}
else {
  var socket = require('socket.io-client').connect('http://localhost:3000');
  socket.once('connect', function () {
    console.log('client online');
    var i = 0;
    var interval = setInterval(function () {
      if (++i > 100) {
        clearInterval(interval);
        socket.disconnect();
        process.exit(0);
      }
      socket.emit('shout', 'hello', 'everyone');
    }, 100);
  })
  socket.on('shout', function (who, what, to, when) {
    console.log(who + ' said ' + what + ' to ' + to + ' at ' + when);
  });
}

