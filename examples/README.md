#Examples

To run each example.

```
$ ./run
```

##Getting a bus is simple.

Specify a `Number` for the *port*.

```javascript
var bus = require('bus.io')();
bus.listen(3000);
```

Or

```javascript
var bus = require('bus.io')(3000);
```

You can listen to an `http.Server` instance with [express](https://github.com/visionmedia/express "express").

```javascript
var app = require('express')();
var server = require('http').Server(app).listen(3000, function (err) { });
var bus = require('bus.io')(server);
```

You have the ability to control the underlying [socket.io](https://github.com/Automattic/socket.io "socket.io") instance

```javascript
bus.io().on('connection', function (socket) {
  socket.emit('hello');
});
```

You can quickly attach a `connection` event listener.

```javascript
bus.socket(function (socket) {
  socket.on('some thing', function () {
    socket.emit('some thing', new Date());
  });
});
```

## Configuration

### Setting the Actor

You can bind custom handlers to each *socket* when it is connected.

```javascript
bus.socket(function (socket, bus) {
  socket.emit('hello socket.io', 'from bus.io');
});
```

The **actor** is the entity associated with a socket.  Actors each have their
own channel.  Actors send messages to other actors.  By default an *actor*
is represented by the socket identifier.  You can customize this behavior. 
Here we are using a username from a session.

```javascript
bus.actor(function (socket, cb) {
  cb(null, socket.handshake.data.session.user);
});
```

You could write a `middleware` function to set the actor on the message too.

```javascript
bus.in(function (message, socket, next) {
  // set actor
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
bus.in(function (message, socket, next) {
  // set target
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
  bus.alias(socket, 'everyone');
});
```

You can add listeners by calling `addListener('event', function() {})` on the *bus* instance.

## Handling Messages

### Messages from the Socket going into the Bus

You can specify middleware functions to manipulate the messages incoming from
the socket before going into the bus.

Here we are processing *all* messages.

```javascript
bus.in(function (message, socket, next) {
  message.content()[0] += '!';
  next(); //you must call next or either message.deliver(), message.consume(), message.respond()

});
```

Here we are processing only *chat* messages.

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

#### Delivering messages

```javascript
bus.on('some message', function (message) {
  message.deliver();
}).
```

You can also propagate a message to an additional target.

```javascript
bus.on('some message', function (message) {
  message.deliver('some target');
});
```

Or propagate to  many targets either passing in multiple recipients or calling deliver multiple times.

```javascript
bus.on('some message', function (message) {
  message.deliver('b', 'c', 'd').deliver('e');
});
```

#### Consuming messages

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

#### Creating messages

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

Simply put.

```javascript
bus.on('some message', function (message) {
  bus.message()
    .i('me')
    .did('say')
    .what('hello')
    .to('you');
});
```

You can add a middleware function that all messages will go through.

```javascript

bus.on(function (message, next) {
  message.content(message.content().toUpperCase());
  next();
});

```

Try adding middleware for specific events.

```javascript
bus.on('some event', function (message, next) {
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

Try adding middleware for specific events.

```javascript
bus.out('chat', function (message, socket, next) {
  message.content()[0] += '!!'; 
  message.deliver();
});
```

