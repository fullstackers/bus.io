[![Build Status](https://travis-ci.org/turbonetix/bus.io.svg?branch=master)](https://travis-ci.org/turbonetix/bus.io)
[![NPM version](https://badge.fury.io/js/bus.io.svg)](http://badge.fury.io/js/bus.io)
[![David DM](https://david-dm.org/turbonetix/bus.io.png)](https://david-dm.org/turbonetix/bus.io.png)

![Bus.IO](https://raw.github.com/turbonetix/bus.io/master/logo.png)

An [express](https://github.com/visionmedia/express "express") inspired, event-driven framework for building real time distributed applications over [socket.io](https://github.com/Automattic/socket.io "socket.io") and [redis](https://github.com/antirez/redis "redis").

### The Server

```javascript
var express = reuqire('express');

var app = express();
app.use(express.static(__dirname+'/public'));

var server = require('http').Server(app).listen(3000);

var bus = require('bus.io')(server);
```

### The Client

```html
<script type="text/javascript" src="/socket.io/socket.io"></script>
<script type="text/javascript">
  var client = io.connect();
  client.on('connect', function () {
    client.emit('echo', 'Hello, World!');
  });
  client.on('echo', function (who, what) {
    console.log(what);
  });
</script>
```

# How this works (nutshell)

Each **socket** is associated with one ore more **actors**.  When a socket 
receives data, the data is encapsulated as a **messsage** and written to a 
**queue**.  Since *all* of your app instances are connected to that queue,
one of them will receive the message for processing.  After the instance
handles the message it can be delivered to the **target**. A target is just
another actor, so if your actor is associated with multiple sockets.  Each
socket, regardless of which app instance it is connected to, will receive the 
data from the message.

# Installation and Environment Setup

Install node.js (See download and install instructions here: http://nodejs.org/).

Install redis (See download and install instructions http://redis.io/topics/quickstart)

Clone this repository

    > git clone git@github.com:turbonetix/bus.io.git

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

Here we can use an already existing **socket.io** instance.

```javascript

var io = require('socket.io')();

var bus = require('bus.io')();
bus.listen(io);

```

Or you can just listen to a port.

```javscript

var bus = require('bus.io')();
bus.listen(3000);

```

You can listen to a server with express.

```javascript

var app = require('express')();

var server = require('http').createServer(app).listen(3000, function (err) { });

var bus = require('bus.io')(server);

```

You can even sperate out **express**, **socket.io**, and **bus.io**.

```javascript

var app = require('express')();

var server = require('http').createServer(app).listen(3000, function (err) { });

var io = require('socket.io')(server);

var bus = require('bus.io')(io);

```

You have the ability to control the underlying socket.io instance

```javascript

bus.io().on('connection', function (socket) {
  socket.emit('hello');
});

```

## Configuration

### Setting the Actor

You can bind custom **socket.io** handlers to each **socket** when it is connected.

```javascript

bus.socket(function (socket, bus) {
  socket.emit('hello socket.io', 'from bus.io');
});

```

The **actor** is the entity associated with a socket.  Actors each have their
own channel.  Actors send messages to other actors.  By default an **actor**
is represented by the socket identifier.  You can customize this behavior. 
Here we are using a username from a session.

```javascript

bus.actor(function (socket, cb) {
  cb(null, socket.handshake.data.session.user);
});


```

You could write a `middleware` function to set the actor on the message too.

```javascript

// set actor
bus.in(function (message, socket, next) {
  message.actor(socket.user);
  next();
})

```

### Setting the Target

The **target** also is an actor.  The target can be pulled from the socket or
the parameters from a message received on a socket.  By default the target
is the socket identifier.

```javascript

bus.target(function (socket, params, cb) {
  cb(null, params.pop());
});

```

You can write a middleware function to set the target too.

```javascript

// set target
bus.in(function (message, socket, next) {
  message.target(message.content().pop());
  next();
});

```

If the client had done this:

The **target** will be "you"

```javascript

socket.emit('say', 'hello', 'you');

```

### Aliasing a Socket to an Actor

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

The **bus** instance has it's *on* method overridden.  You can still add listeners by
calling `addListener('event', function() {})`.

## Handling Messages

### Messages from the Socket going into the Bus

You can specify middleware functions to manipulate the messages incoming from
the socket before going into the bus

```javascript

bus.in(function (message, socket, next) {
  message.content()[0] += '!';
  next(); //you must call next or either message.deliver(), message.consume(), message.respond()

});

```

Or

```javascript

bus.in('chat', function (message, socket, next) {
  message.content()[0] += '!!'; 
  message.deliver();
});

```

### Messages on the Bus

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

It is possible to consume a message so it won't be delivered to the original recipient and then deliver it
to other recipients.

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
  
  bus.message({
    actor:'I',
    action:'say',
    content:'hello'
    target:'you',
  }).deliver();

  message.deliver();

});

```

A chain-able approach.

```javascript

bus.on('some message', function (message) {
  
  bus.message()
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
  
  bus.message()
    .i('me')
    .did('say')
    .what('hello')
    .to('you');

});

```

You can write handlers middleware functions too.

This example will uppercase the content for all messages.

```javascript

bus.on(function (message, next) {
  message.content(message.content().toUpperCase());
  next();
});

```

### Messages from the Bus going to the Socket

You can specify middleware functions to manipulate the messages incoming from
the exchange before going to the socket.

```javascript

bus.out(function (message, socket, next) {
  message.data.content[0] += '!';
  next(); //you must call next or either message.deliver(), message.consume(), message.respond()
});

```

Or

```javascript

bus.out('chat', function (message, socket, next) {
  message.content()[0] += '!!'; 
  message.deliver();
});

```

# API Documentation

Most methods are chain-able.  Excepts for when you are getting an object.

e.g.

**Chanin-able**

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

**Not chain-able**

This will produce a runtime error.

```javascript

require('bus.io')().actor().target()

```

## Server

The **Server** is exposed by `require('bus.io')`

### Server()

```javascript

var bus = require('bus.io')();

```

### Server(port:Number)

```javascript

var bus = require('bus.io')(3000);

```

### Server(io:socket.io#Server)

```javascript

var io = require('socket.io')();
var bus = require('bus.io')(io);

```

### Server(server:http#Server)

```javascript

var server = require('http').createServer(function (req, res) {}).listen(function (err) {});
var bus = require('bus.io')(server)

```

### Server#actor(fn:Function)

Sets the function that will grab the actor.  The default implementation 
will use the `socket.id`.  This method is called when the socket connection is 
established.

```javascript 

bus.actor(function (socket, cb) {
  cb(null, socket.id);
});

```
The callback `cb` takes two parameters `err` and `actor`.

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

### Server#actor()

Gets the function that will grab the actor from a socket.

```javascript

    var actorFn = bus.actor();
    
```

### Server#target(fn:Function)

Sets the function that will grab the target from the request.  The 
default implementation will use the `socket.id`.  This method is called for each
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

You get to decide your own convention.

### Server#target()

Gets the method that will grab the target from the request.

```javascript

var targetFn = bus.target();

```

### Server#socket(socket:Object)

This method will allow you to bind a function to the `connection` event that 
socket.io supports.

e.g.

We would like to tell the client `"Hello"` when they connect.

```javascript

bus.socket(function (socket, bus) {
  socket.emit('greet', 'Hello');
});

```

### Server#alias(socket:Object, name:String)

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

### Server#in(fn#Function,...)

The **in** method will use the passed function(s) when a message is received 
from the `socket`.  This allows you to modify the message before it
is sent to the `exchange`.

```javascript

bus.in(function (message, socket, next) {
  message.content([message.content()[0].toLowerCase()]);
  next();
});

```

You can pass in multiple functions or arrays of functions.

```javascript

bus.in(function (a,b,c) {...}, function (a,b,c) {...}, [function (a,b,c) {...}, function(a,b,c) {...}]);

```

You can set up handlers for specific messages.

```javascript

bus.in('chat', function (message, socket, next) {
  // do something
  next();
});

```

If you bind multiple handlers they will be called in this order

```javascript
bus.in('chat', function (message, socket, next) {
  message.content('A');
  next();
});

bus.in(function (message, socket, next) {
  message.content(message.content()+'B');
});

bus.in('chat', function (message, socket, next) {
  message.content(message.content()+'C');
  next();
});

// The output of message.content() will be 'ABC';

```

You can control propagation with `consume()`, `deliver()`, `respond()` as well.

```javascript

bus.in(function (message, socket, next) {
  message.deliver();
});

bus.in(function (message, socket, next) {
  // will not be called because the message will delivered to the target 
  // as a result of calling deliver!!
});

// consume()

bus.in(function (message, socket, next) {
  message.consume();
  // the message will just die here
});


```

### Server#on(event:String, fn:Function)

The **on** method binds a handler to the queue.  The handler will process each
message and give you the ability to either deliver the message or discard it.
That is up to your application requirements.

```javascript

bus.on('some event', function (message) {
  message.deliver();
});

```

Or you can use the optional `next` parameter.  You may eiter call `next()` to
invoke the next handler.  Or you may call `message.deliver()`, `message.respond()`,
or `message.consumed()` to control the message's propagation.

```javascript

bus.on('some event', function (message, next) {
  // do something!
  next();
});

```

### Server#out(fn:Function,...)

The **out** method will use the passed function(s) when a message is received
from the `exchange`. This allows you to modify the message before it
is sent to the `socket`. 

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

You can pass in multiple functions or arrays of functions.

```javascript

bus.out(function (a,b,c) {...}, function (a,b,c) {...}, [function (a,b,c) {...}, function(a,b,c) {...}]);

```

You can set up handlers for specific messages.

```javascript

bus.out('chat', function (message, socket, next) {
  // do something
  next();
});

```

If you bind multiple handlers they will be called in this order

```javascript
bus.out('chat', function (message, socket, next) {
  message.content('A');
  next();
});

bus.out(function (message, socket, next) {
  message.content(message.content()+'B');
});

bus.out('chat', function (message, socket, next) {
  message.content(message.content()+'C');
  next();
});

// The output of message.content() will be 'ABC';

```

You can control propagation with `consume()`, `deliver()`, `respond()` as well.

```javascript

bus.out(function (message, socket, next) {
  message.deliver();
});

bus.out(function (message, socket, next) {
  // will not be called because the message will delivered to the target 
  // as a result of calling deliver!!
});

// consume()

bus.out(function (message, socket, next) {
  message.consume();
  // the message will just die here
});


```

### Server#listen(o:Mixed)

You can either pass a `port`, `server`, or `socket.io` instance.

```javascript

bus.listen(3000);

bus.listen(require('http').createServer(function (req, res) { }));

bus.listen(require('socket.io')());

```

### Server#message(data:Mixed)

This will create you an object for building a message that you can deliver.  The
`data` can either be an object or an instanceof of `Message`.

```javascript
  
bus.message({
  actor:'I',
  action:'say',
  content:'hello'
  target:'you',
}).deliver();

```

A chain-able approach.

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

bus.message()
  .i('me')
  .did('say')
  .what('hello')
  .to('you');

```

### Server#exchange()

Gets the exchange the server uses to publish information.

See **[bus.io-exchange](https://github.com/turbonetix/bus.io-exchange "bus.io-exchange")**

```javascript

var exchange = bus.exchange();

```

### Server#exchange(exchange:Server.Exchange)

Sets the exchange the server uses to publish information.

See **[bus.io-exchange](https://github.com/turbonetix/bus.io-exchange "bus.io-exchange")**

for more information.

```javascript

var exchange = require('bus.io').Exchange();
bus.exchange(exchange);

```

### Server#queue()

Gets the `Queue` the `Exchange` uses.

```javascript

var queue = exchange.queue();

```


### Server#queue(queue:Server.Exchange.Queue)

Sets the `Queue` the `Exchange` uses.

See **[bus.io-exchange](https://github.com/turbonetix/bus.io-exchange "bus.io-exchange")**

```javascript

var queue = require('bus.io').Exchange.Queue();
bus.queue(queue);

```

### Server#pubsub()

Gets the `PubSub` the `Exchange` uses.

See **[bus.io-exchange](https://github.com/turbonetix/bus.io-exchange "bus.io-exchange")**

```javascript

var pubsub = exchange.pubsub();

```


### Server#pubsub(pubsub:Server.Exchange.PubSub)

Sets the `PubSub` the `Exchange` uses.

```javascript

var pubsub = require('bus.io').Exchange.PubSub();
bus.pubsub(pubsub);

```

### Server#autoPropagation(v:Boolean)

Instead of having to write a function to deliver a message like this.

```javascript

bus.on('some message', function (message) {
  message.deliver();
});

```

We could call `autoPropagate(true)` so that any method we have not declared a
handler for will automatically be propagated.

```javascript

bus.autoPropagate(true);

```

Auto-propagation is **on** by default.  You may turn it off to prevent unwanted
messages from going into your `bus`.

## Components and their Documentation

Bus.io is broken down into other components.

* **[bus.io-common](https://github.com/turbonetix/bus.io-common "bus.io-common")** contains all the common
code such as the `Message`, `Builder`, and `Controller` classes.
* **[bus.io-exchange](https://github.com/turbonetix/bus.io-exchange "bus.io-exchange")** contains all
the code that will be used to handle messages going into the `Queue` and propagation on the `PubSub`.
* **[bus.io-messsages](https://github.com/turbonetix/bus.io-messages "bus.io-messages")** contains the
code that handles listening to a socket.io `Socket` for an `event` and building that into a `message`.
* **[bus.io-driver](https://github.com/turbonetix/bus.io-driver "bus.io-driver")** **(Needs Implemented)** 
The driver helps you test driver bus.io in your apps.
* **[bus.io-client](https://github.com/turbonetix/bus.io-client "bus.io-client")** **(Needs Implemented)**
The bus.io client is a wrapper for the socket.io client and it helps you build and process messages.

# Running Tests

Install coffee-script

    > npm install coffee-script -g

Tests are run using grunt.  You must first globally install the grunt-cli with npm.

    > sudo npm install -g grunt-cli

## Unit Tests

To run the tests, just run grunt

    > grunt spec

# TODO

There are open issues ff you would like to contribute please fork and send me 
a pull request!

# Working Examples and Demos

You will need a redis server up and running to run the demos at this time

    > node examples/hello.js

# Demos

Demos are under the `/demo` directory.  There is currently a basic chat program.

# Ideas

## Regex support / wild cards for actions

Using regex instead of just string literals.

```javascript

bus.in(/\w+/, function (message, socket, next) {
  next();
});

// or

bus.in('user does *', function (message, socket, next) {
  next();
});

```

## Message Verification

When messages are published it would be nice if we can validate the message and verify
the integrity of the message.

## Use socket.io rooms

**This could be implemented using a middleware**

Each actor has their own channel currently.  It maybe nice to utilize that functionality.
One can broadcast their message to a number of targets

```javascript

bus.on('some event', function (message) {
  message.deliver('a','b','c','d','e');

});

```

