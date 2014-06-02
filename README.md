[![Build Status](https://travis-ci.org/NathanGRomano/bus.io.svg?branch=master)](https://travis-ci.org/NathanGRomano/bus.io)

Bus.io seamlessly connects clients together over a network using socket.io
and redis.  Messages are produced by clients which are published to an 
exchange.  The exchange queues up these messages to be handled.  When these 
messages are handled they can then be published to subscribers over a channel.
Channels are identified by the actors and targets.  Messages are composed of 
an actor, a target, an action, and the content.  A message describes an action 
performed by a client toward another client or resource.  With Bus.io we can 
build applications that will scale.

# How this works

A round trip looks like this.

Socket -> SocketMessages -> Receiver -> MessageExchange -> Handler ->
MessageExchange -> Receiver -> Socket

Where **Handler** is the code that will handle the message and propagate it
back out to the Exchange.

# Installation and Environment Setup

Install node.js (See download and install instructions here: http://nodejs.org/).

Install redis (See download and install instructions http://redis.io/topics/quickstart)

Clone this repository

    > git clone git@github.com:NathanGRomano/bus.io.git

cd into the directory and install the dependencies

    > cd bus.io
    > npm install && npm shrinkwrap --dev

## Simple Server

This is a simple server that will process a message and deliver it to the target.

```javascript

var bus = require('bus.io')(3000);
bus.on('echo', function (message) {
  message.deliver(); 
});

```

On the client could do this

```javascript

var socket = require('socket.io-client')('http://localhost:3000');
socket.on('connect', function () {
  socket.emit('echo', 'hello');
});
socket.on('echo', function (who, what, target, created) {
  console.log('Socket ' + who + ' said ' + what + ' to ' + target + ' at ' + created);
});

```

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

bus.io().on('connection', function (socket) {
  socket.emit('hello');
});

```

## Configuration

The **actor** is the entitty assocaited with a socket.  Actors each have their
own channel.  Actors send messages to other actors.  By default an **actor**
is represented by the socket identifier.  You can customize this behavior. 
Here we are using a username from a session.

```javascript

bus.actor(function (socket, cb) {
  cb(null, socket.handshake.data.session.user);
});


```

The **target** also is an actor.  The target can be pulled from the socket or
the parameters from a message received on a socket.  By default the target
is socket identifier.

```javascript

bus.target(funciton (socket, params, cb) {
  cb(null, params.pop());
});

```

If the client had done this:

The **target** will be "you"

```javascript

socket.emit('say', 'hello', 'you');

```

The **bus** instance has it's *on* method overriden.  You can still add listeners by
calling addListener.


##Handling messages on the bus

Messages received can be propagated to their target by calling *deliver*.

Here we are writing out the message contents.  After this handler is executed the 
message will continue to propagate.

```javascript

bus.on('some message', function (message) {
  console.log(message);
  message.deliver();
}).

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

bus.on('some message', function (message) {
  
  this.message({
    actor:'I',
    action:'say',
    content:'hello'
    target:'you',
  }).deliver();

});

```

A chainable approach.

```javascript

bus.on('some message', function (message) {
  
  this.message().actor('me').action('say').content('hello').target('you').deliver();

});

```

Or simply

```javascript

bus.on('some message', function (message) {
  
  this.message().i('me').did('say').what('hello').to('you');

});

```

## Handling messages received from the Exchange

You can specify middlware functions to manipulate the messages incomming from
the exchange before being emitted to the client.

```javascript

bus.exchangeReceiver().use(function (message, socket, next) {
  message.data.content += '!';
  next(); // you must call next!
});

```

Or

```javascript

bus.in(function (message, socket, next) {
  message.data.content += '!';
  next(); // you must call next!
});

```

## Handling messages received from the Socket

You can specify middleware functions to manipulate the messages incomming from
the client before being emitted to the exchange.

```javascript

bus.socketReceiver().use(function (message, socket, next) {
  message.data.content += '!';
  next(); // you must call next!
});

```

Or

```javascript

bus.out(function (message, socket, next) {
  message.data.content += '!';
  next(); // you must call next!
});

```

# Running Tests

Install coffee-script

    > npm install coffee-script -g

Tests are run using grunt.  You must first globally install the grunt-cli with npm.

    > sudo npm install -g grunt-cli

## Unit Tests

To run the tests, just run grunt

    > grunt spec

# TODO

* specify the name of the events to be processed as we receive them from the exchange to the client
* write another receiver from the client to the exchange
* Lots
* Write e2e tests
* Code coverage

If you would like to contribute please fork and send me a pull request.

# Working Examples and Demos

You will need a redis server up and running to run the demos at this time

    > node examples/hello.js

# Ideas

## Receiver Message Routing

Currently all messages are passed through the Receivers

```javascript

bus.in(function (message, socket, next) {
  //do something!
  next();
});

```

It would be nice to handle specific kinds of messages

```javascript

bus.in('echo', function (message, socket, next) {
    assert.equals(message.data.action, 'echo');
    next();
});

```

## Use socket.io rooms

Each actor has their own channel currently.  It maybe nice to utilize that functionality.
One can broadcast their message to a number of targets

```javascript

bus.on('some event', function (message) {

  message.deliver('a','b','c','d','e');

});


```

## Message consumption

In order to control propagation you can consume the message.

```javascript

bus.on('some message', function (message) {
  message.consume();
});

```

