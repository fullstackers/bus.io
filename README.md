[![Build Status](https://travis-ci.org/NathanGRomano/bus.io.svg?branch=master)](https://travis-ci.org/NathanGRomano/bus.io)
[![NPM version](https://badge.fury.io/js/bus.io.svg)](http://badge.fury.io/js/bus.io)

Easily build robust and scalable applications!

Bus.io seamlessly connects clients and servers together over a network using 
**[socket.io](https://github.com/Automattic/socket.io "socket.io")** and 
**[redis](https://github.com/antirez/redis "redis")**.  Messages are produced 
by clients which are published to an exchange.  The exchange queues up these 
messages to be handled.  Messages are composed of an actor, a target, an 
action, and the content.  When these messages are handled they can then be 
published to subscribers over a channel.  Channels are identified by the 
actors and targets.

# How this works

A round trip of a **Message** looks like this.

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

You can bind custom **socket.io* handlers to each **socket** when it is connected.

```javascript

bus.socket(function (socket, bus) {
  socket.emit('hello socket.io', 'from bus.io');
});

```

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

bus.target(function (socket, params, cb) {
  cb(null, params.pop());
});

```

If the client had done this:

The **target** will be "you"

```javascript

socket.emit('say', 'hello', 'you');

```

Set up an **alias** for your actor.  When a message is sent to the alias the socket
will receive the message.

```javascript

bus.socket(function (socket, bus) {
  socket.get('user', function (err, user) {
    if (err) return socket.emit('err');
    if (!user) return socket.emit('login', 'You must login');
    bus.alias(socket, user.name);
  });
});

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

  message.respond({some:'some other content'});

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
  
  this.message()
    .actor('me')
    .action('say')
    .content('hello')
    .target('you')
    .deliver();

});

```

Or simply

```javascript

bus.on('some message', function (message) {
  
  this.message()
    .i('me')
    .did('say')
    .what('hello')
    .to('you');

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
  message.data.content[0] += '!';
  next(); // you must call next!
});

```

Or

```javascript

bus.out(function (message, socket, next) {
  message.data.content[0] += '!';
  next(); // you must call next!
});

```

# API Documentation

## Bus

Most methods are chainable.  Excepts for when you are getting an object.

e.g.

**Chaninable**

```javascript

require('bus.io')()
  .actor(function (socket, cb) { ... })
  .target(function (socket, params, cb) { ... })
  .socket(function (socket, bus) { ... })
  .in(function (message, socket, next) { ... })
  .on('some event', function (message) { ... })
  .out(function (message, socket, next) { ... })
  .listen(3000)

```

**Not chainable**

This will produce a runtime error.

```javascript

require('bus.io')().actor().target()

```

### #actor

Sets / Gets the function that will grab the actor.  The default implementation 
will use the `socket.id`.  This method is called when the socket connection is 
established.

```javascript 

bus.actor(function (socket, cb) {
  cb(null, socket.id);
});

```

You may pass an `Error` object for the first argument if you encounter an error
or would like to trigger one.


```javascript

bus.actor(function (socket, cb) {
  socket.get('user', function (err, user) {
    if (err)
      return cb(err);
    if (!user)
      return cb(new Error('Need to login'));
    return cb(null, user.name);
  });
});

```

### #target

Sets / Gets the function that will grab the target from the request.  The 
default implemenation will use the `socket.id`.  This method is called for each
request from the `socket`.

The client would emit this.

```javascript

socket.emit('shout', 'hello', 'You');

```

We would like `"You"` to be the *actor*.

```javascript

bus.target(function (socket, params, cb) {
  cb(null, params.pop());
});

```

If you encounter an error you can also pass one along.

```javascript

bus.target(function (socket, params, cb) {
  if (params.length === 0) {
    cb(new Error('You are you talking to?!'));
  }
  else {
    cb(null, params.pop());
  }
});

```

You get to decide your own convetion.

### #socket

This method will allow you to bind a function to the `connection` event that 
socket.io supports.

e.g.

We would like to tell the client `"Hello"` when they connect.

```javascript

bus.socket(function (socket, bus) {
  socket.emit('greet', 'Hello');
});

```

### #alias

With **alias** your **actor** will receive messages whenever their **alias**
receives one.  This is useful if you want to associate a socket to a logged in 
user.

```javascript

bus.alias(socket, 'nathan');

```

A good place to do this is when the client is connected to the server.

```javascript

bus.socket(function (socket, bus) {

  socket.get('user', function (err, user) {

    if (err) return socket.emit('error', err);
    if (!user) return socket.emit('login', 'You must login');
    
    bus.alias(socket, user.name);

  });

});

```

### #in

The **in** method will use the passed function(s) when a message is received 
from the `bus.messageExchange()`.  This allows you to modifiy the message before it
is sent to the `socket`.

```javascript

bus.in(function (message, socket, next) {
  message.data.content[0] = message.data.content[0].toLowerCase();
  next();
});

```

### #on

The **on** method binds a handler to the queue.  The handler will process each
message and give you the ability to either deliver the messsage or discard it.
That is up to your application requirements.

```javascript

bus.on('some event', function (message) {
  message.deliver();
});

```

### #out

The **out** method will use the passed function(s) when a message is received
from the `socket` before it is published to the 
`bus.messageExchange()` instance.

Here you could save the message to a mongo store using mongoose.

```javascript

//assuming you have mongoose and a message model
var Message = monngose.model('Message');

bus.out(function (message, socket, next) {
  new Message(message.data).save(function (err) {
    if (err) return next(err);
    next();
  });
});

```

### #listen

You can either pass a `port`, `server`, or `socket.io` instance.

```javascript

bus.listen(3000);

bus.listen(require('http').createServer(function (req, res) { }));

bus.listen(require('socket.io')());

```

### #message

This will create you an object for building a message that you can deliver.

```javascript
  
bus.message({
  actor:'I',
  action:'say',
  content:'hello'
  target:'you',
}).deliver();

```

A chainable approach.

```javascript
  
bus.message()
  .actor('me')
  .action('say')
  .content('hello')
  .target('you')
  .deliver();

```

Or simply

```javascript

this.message()
  .i('me')
  .did('say')
  .what('hello')
  .to('you');

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

* Specify the name of the events to be processed as we receive them from the 
  exchange to the client
* Write e2e tests
* Code coverage
* Working with message data is cumbersome.
* Examples, Examples, Examples

If you would like to contribute please fork and send me a pull request!

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

