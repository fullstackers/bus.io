Bus.io seamlessly connects to clients together over a network.  Messages are 
produced by clients which are published to an exchange.  The exchange queues up
these messages to be handled.  When these messages are handled they can then
be published to subscribers over a channel.  Channels are identified by the
actors and targets.  Messages are composed of an actor, a target, an action, 
and the content.  A message describes an action performed by a client toward
another client or resource.  With Bus.io we can build application that will
scale. Bus.io is built on top of socket.io.

# Installation and Environment Setup

Install node.js (See download and install instructions here: http://nodejs.org/).

Install coffee-script

    > npm install coffee-script -g

Clone this repository

    > git clone git@github.com:NathanGRomano/bus.io.git

cd into the directory and install the dependencies

    > cd bus.io
    > npm install && npm shrinkwrap --dev

# Examples

##Getting a bus is simple.


```javascript

var io = require('socket.io')();

var bus = reuqire('bus.io')();
bus.listen(io);

```

Or you can just listen to a port.

```javscript

var bus = require('bus.io')();
bus.listen(3000);

```

You have the ability to control the underlying socket.io instance

```javascript

bus.io.on('connection', function (socket) {
  socket.emit('hello');
});

```

```

##Handling messages on the bus

All messages received by clients are propogated to their targets.  You can control
how messages are handled and propagated.

Here we are writing out the message contents.  After this handler is executed the 
message will continue to propagate.

```javascript

bus.on('some message', function (message) {
  console.log(message);
  message.deliver();
}).

```

In order to control propagation you can consume the message.

```javascript

bus.on('some message', function (message) {
  message.consume();
});

```

You can also propagate a message to an additional target.

```javascript

bus.on('some message', function (message) {
  message.deliver('some target');
});

```

Or many targets either passing in multiple recipients or calling deliver multiple times.

```javascript

bus.on('some message', function (message) {
  message.deliver('b', 'c', 'd').deliver('e');
});

```

It is possible to consume a message so it won't be delivered to the original receipent and then deliver it
to other receipients.

```javascript

bus.on('some message', function (message) {
  message.consume().deliver('some target').deliver('other', 'targets');
});

```

You can respond to messages too.

```javascript

bus.on('some message', function (message) {

  message.respond({some:'additional content'});

});

```

Or even create new messages.

```javascript

bus.on('some message', function (message, bus) {
  
  bus.message({
    actor:'I',
    action:'say',
    content:'hello'
    target:'you',
  }).deliver();

});

```

A chainable approach.

```javascript

bus.on('some message', function (message, bus) {
  
  bus.message().actor('me').action('say').content('hello').target('you').deliver();

});

```

Or simply

```javascript

bus.on('some message', function (message, bus) {
  
  bus.message().i('me').did('say').what('hello').to('you');

});

```

# Running Tests

Tests are run using grunt.  You must first globally install the grunt-cli with npm.

    > sudo npm install -g grunt-cli

## Unit Tests

To run the tests, just run grunt

    > grunt spec

# TODO

Implementation

# Ideas

##Passengers on the bus

A passenger allows you to write specific handlers for when they receive a message.

```javascript

bus.on('passenger', function (passenger) {
  passenger.on('some message', function (message) {
    message.consume();
  });
});

