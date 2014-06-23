var util = require('util')
  , events = require('events')
  , debug = require('debug')('server')
  , sio = require('socket.io')
  , common = require('bus.io-common')
  , Message = common.Message
  , Builder = common.Builder
  , Messages = require('bus.io-messages')
  , Exchange = require('bus.io-exchange')
  , Receiver = require('bus.io-receiver')
  ;

exports = module.exports = Server;
exports.version = require('./../package.json').version
exports.Server = Server;
exports.Exchange = Exchange;
exports.Messages = Messages;

/**
 * The bus
 *
 * @param {object} io socket.io intance or http.Server
 */

function Server (a) {

  if (!(this instanceof Server)) return new Server(a);

  debug('new server', a);

  var self = this;

  events.EventEmitter.call(this);

  /**
   * Called when we are supposed to publish the message. this is bound to a 
   * Builder instance an Receiver instances
   *
   * @param {Message} message
   */

  this.onPublish = function (message) {
    // TODO I think the exchange should handle setting the flag for being published or not.
    debug('on publish ', message.id());
    if (message.data.published) {
      debug('message is going to pubsub %s', message.id());
      self.exchange().publish(message, message.target());
    }
    else {
      debug('message is going to the queue %s', message.id());
      message.data.published = new Date();
      self.exchange().publish(message);
    }
  };


  /**
   * Called when we receive a socket connection, this is bound to the
   * socket.io instance
   *
   * @param {Socket} socket
   */

  this.onConnection = function (socket) {

    debug('on connection %s', socket.id);

    function handle (message) {
      debug('from excahnge pubsub %s, %s', message.id(), socket.id);
      self.emit('from exchange pubsub', message, socket);
    }

    self.messages().actor(socket, function (err, actor) {
      if (err) return self.emit('error', err);
      self.exchange().subscribe(actor, handle, function (err, channel) {
        debug('subscribed to chanel %s with socket %s', actor, socket.id);
        if (err) return self.emit('error', err);
      });
      socket.on('disconnect', function () {
        self.exchange().unsubscribe(actor, handle, function (err, channel) {
        debug('unsubscribed from chanel %s with socket %s', actor, socket.id);
          if (err) return self.emit('error', err);
        });
      });
    });

  };

  /**
   * Called when we reeived a message from the Messages.  This is bound
   * to the Messages instance.  It will then emit an event for the
   * SocketReceiver intance to handle. This is when the Messages instance
   * finishes createing the message and before the message is passed along to
   * the Receiver for processing before dispatched to the Exchange.
   *
   * @param {object} message
   * @param {Socket} socket
   * @see Messages
   * @see Receiver
   */

  this.onMessage = function (message, socket) {
    debug('on message from socket %s, %s', (message && message.data ? message.data.id : null), (socket ? socket.id : null));
    self.emit('from socket', message, socket);
  };

  /**
   * Called after we have received a message from the Exchange
   *
   * @param {Message} message
   * @param {Socket} socket
   * @see Exchange
   * @see Receiver
   */

  this.onReceivedPubSub = function (message, socket) {
    debug('sending message %s to socket %s', (message && message.data ? message.data.id : null), (socket ? socket.id : null));
    socket.emit.apply(socket, [message.data.action, message.data.actor].concat(message.data.content).concat([message.data.target, message.data.created]));
  };

  /**
   * Called after we have received a message from the socket.  This is after
   * the SocketMessage instance creates a message and the Receiver instance
   * processes it through the middleware.
   *
   * @param {Message} message
   * @param {Socket} socket
   * @see Messages
   * @see Receiver
   */

  this.onReceivedSocket = function (message, socket) {
    debug('received a message %s from the socket %s ', (message && message.data ? message.data.id : null), (socket ? socket.id : null));
    self.message(message).deliver();
  };

  /**
   * Called when we receveie a message on the Queue
   *
   * @param {object} message
   * @see Exchange
   */

  this.onReceivedQueue = function (message) {
    debug('received message %s from queue', message.id());
    self.emit('from exchange queue', message);
  };

  /**
   * Handles our error
   *
   * @param {mixed} err
   */

  this.onError = function () {
    debug('on error', arguments);
    console.error.apply(console,Array.prototype.slice.call(arguments));
  };

  this.addListener('error', this.onError);

  this.incomming();

  this.processing();

  this.outgoing();

  this.autoPropagate(true);

  if (a) {
    debug('we have something so we will try to listen to it');
    this.listen(a);
  }
}

util.inherits(Server, events.EventEmitter);

/**
 * Listen on the port or socket.io instance
 *
 * @param {mixed} Either a number or a Socket.IO instance
 * @return Server
 */

Server.prototype.listen = function (a) {


  if (a instanceof sio) {
    debug('a socket.io instance');
    this.io(a);
  }
  else if (!isNaN(a)) {
    debug('a port number');
    this.io().listen(a);
  }
  else {
    debug('some other options going into socket.io');
    this.io(sio(a));
  }

  return this;
};

/**
 * Gets a builder for the passed data
 *
 * @param {object} data
 * @return Builder
 */

Server.prototype.message = function (data) {
  debug('new message with ', data);
  var builder = Builder(data);
  builder.on('built', this.onPublish);
  return builder;
};


/**
 * Sets / Gets the Exchange
 *
 * @param {Exchange} exchange
 * @return Exchange / Server
 */

Server.prototype.exchange = function (exchange) {

  if (typeof exchange === 'object' && exchange instanceof Exchange) {
    debug('setting the exchange');
    
    if (this._exchange) {
      debug('we already have an exchange remove onReceivedQueue listener from the queue');
      this._exchange.queue().removeListener('message', this.onReceivedQueue);
    }

    this._exchange = exchange;
    this._exchange.queue().addListener('message', this.onReceivedQueue);
    return this;
  }

  if (!this._exchange || (!(typeof this._exchange === 'object' && this._exchange instanceof Exchange))) {
    debug('we do not have an exchange so create one');
    this.exchange(Exchange());
  }

  return this._exchange;

};

/**
 * Sets / Gets Messages instance
 *
 * @param {Messages} io * optioanl
 * @return Messages / Server
 */

Server.prototype.messages = function (messages) {
  
  if (typeof messages === 'object' && messages instanceof Messages) {

    debug('setting messages obejct');

    if (this._messages) {
      debug('we already have instance so remove onMessage listener');
      this._messages.removeListener('message', this.onMessage);
    }

    this._messages = messages;
    this._messages.on('message', this.onMessage);
    return this;

  }

  if (!this._messages || (!(typeof this._messages === 'object' && this._messages instanceof Messages) )) {
    debug('we do not have a messages object so create one');
    this.messages(Messages());
  }

  return this._messages;

};

/**
 * Sets / Gets Socket.IO instance
 *
 * @param {SocketIO} io * optioanl
 * @return SocketIO / Server
 */

Server.prototype.io = function (io) {

  if (typeof io === 'object') {

    debug('setting the io object');
    
    if (this._io) {
      debug('we already have one');
      try {
        this.messages().dettach(this._io);
        this._io.removeListener('connection', this.onConnection);
      } catch(e) { console.error(e); }
    }

    this._io = io;
    this.messages().attach(this._io);
    this._io.on('connection', this.onConnection);
    return this;

  }

  if (!this._io) {
    this.io(sio());
  }
  
  return this._io;

};

/**
 * Sets up a handler for the exchange
 *
 * @see Recevier
 * @param {mixex} First item bust be a string or function
 * @return Server
 */

Server.prototype.on = function () {
  if (arguments.length >= 1 && typeof arguments[0] === 'string') {
    debug('first item is a string so call messages action with %s', arguments[0]);
    this.messages().action(arguments[0]);
  }
  debug('calling processing() use', arguments);
  this.processing().use.apply(this.processing(), Array.prototype.slice.call(arguments));
  return this;
};

/**
 * delegate
 *
 * @see Messages
 */

Server.prototype.actor = function () {
  debug('calling messages actor', arguments);
  var o = this.messages();
  o.actor.apply(o, Array.prototype.slice.call(arguments));
  return this;
};

/**
 * delegate
 *
 * @see Messages
 */

Server.prototype.target = function () {
  debug('calling messages targt', arguments);
  var o = this.messages();
  o.target.apply(o, Array.prototype.slice.call(arguments));
  return this;
};

/**
 * initialize the receiver.  it will handle messages comming from the socket
 * before it gets to the exchange
 *
 * @see Receiver
 * @return Server / Receiver
 */

Server.prototype.incomming = function (o) {

  if (typeof o === 'object' && o instanceof Receiver) {
    debug('setting new receiver for incomming');
    if (this._incomming) {
      debug('we already have one, so remove listeners');
      this.removeListener('from socket', this._incomming.onReceive);
      this._incomming.removeListener('error', this.onError);
      this._incomming.removeListener('received', this.onReceivedSocket);
    }

    this._incomming = o;
    this._incomming.addListener('error', this.onError);
    this._incomming.addListener('received', this.onReceivedSocket);
    this.addListener('from socket', this._incomming.onReceive);

    return this;
  }

  if (!this._incomming || (!(this._incomming instanceof Receiver))) {
    debug('we do not have incomming receiver so setting it');
    this.incomming(Receiver());
  }

  return this._incomming;

};

Server.prototype.socketReceiver = Server.prototype.incomming;

/**
 * initializes the receiver.  it will handle messages on the bus, this happens
 * after we get the message in from the socket, and before we send the message
 * to the socket.
 *
 * @see Receiver
 * @return Server / Receiver
 */

Server.prototype.processing = function (o) {

  if (typeof o === 'object' && o instanceof Receiver) {
    debug('setting processing receiver');
    if (this._processing) {
      debug('we already have one remove listeners');
      this.removeListener('from exchange queue', this._processing.onReceive);
      this._processing.removeListener('error', this.onError);
      this._processing.removeListener('received', this.onPublish);
    }

    this._processing = o;
    this._processing.addListener('error', this.onError);
    this._processing.addListener('received', this.onPublish);
    this.addListener('from exchange queue', this._processing.onReceive);

    return this;
  }

  if (!this._processing || (!(this._processing instanceof Receiver))) {
    debug('we do not already have processing receiver set it');
    this.processing(Receiver());
  }

  return this._processing;

};

/**
 * initialize the receiver.  it will handle messages comming from the exchange
 * before it gets to the socket
 *
 * @see Receiver
 * @param {Receiver} o
 * @return Server / Receiver
 */

Server.prototype.outgoing = function (o) {

  if (typeof o === 'object' && o instanceof Receiver) {
    debug('setting outgoing receiver');
    if (this._outgoing) {
      debug('we already have one so remove lsiteners');
      this.removeListener('from exchange pubsub', this._outgoing.onReceive);
      this._outgoing.removeListener('error', this.onError);
      this._outgoing.removeListener('received', this.onReceivedPubSub);
    }

    this._outgoing = o;
    this._outgoing.addListener('error', this.onError);
    this._outgoing.addListener('received', this.onReceivedPubSub);
    this.addListener('from exchange pubsub', this._outgoing.onReceive);

    return this;
  }

  if (!this._outgoing || (!(this._outgoing instanceof Receiver))) {
    debug('we do not have outgoing receiver so setting it');
    this.outgoing(Receiver());
  }

  return this._outgoing;

};


/**
 * Binds a method to the exchange receiver for processing the incomming 
 * messages from the exchange before being dispatched to the socket.
 *
 * @see Receiver
 * @param {mixed} First item must be a string or Function
 * @return Server
 */

Server.prototype.out = function () {
  debug('calling outgoing use');
  this.outgoing().use.apply(this.outgoing(), Array.prototype.slice.call(arguments));
  return this;
};

/**
 * Binds a method to the socket receiver for processing the incomming
 * message received from the Messages before being dispatched to the 
 * exchange.
 *
 * @see Receiver
 * @param {mixed} First item must be a string or Function
 * @return Server
 */

Server.prototype.in = function () {
  debug('calling incomming use');
  this.incomming().use.apply(this.incomming(), Array.prototype.slice.call(arguments));
  return this;
};

/**
 * Binds the method to socket.io's "connection" event
 *
 * @see socket.io
 * @param {function} fn
 * @return Server
 */

Server.prototype.socket = function (fn) {
  debug('calling io() on \'connection\'');
  var self = this;
  this.io().on('connection', function (socket) {
    return fn(socket, self);
  });
  return this;
};

/**
 * sets up an alias for the actor / socket
 *
 * @param {Socket} socket
 * @param {string} name
 * @param {Function} done * optional
 * @return Server
 */

Server.prototype.alias = function (socket, name, done) {
  debug('aliasing a socket %s to the name %s', socket.id, name);

  var self = this;
  var handle = function (message) {
    debug('[alias "%s"] from exchange pubsub message %s, socket %s', name, message.id(), socket.id);
    self.emit('from exchange pubsub', message, socket);
  };

  this.exchange().subscribe(name, handle, function (err, channel) {

    if (err) return self.emit('error', err);

    debug('[alias "%s"] subscribed  %s, socket %s', name, channel, socket.id);

    socket.on('disconnect', function () {
      self.exchange().unsubscribe(name, handle, function (err, channel) {
        if (err) return self.emit('error', err);
        debug('[alias "%s"] unsubscribed  %s, socket %s', name, channel, socket.id);
      });
    });

    if (typeof done === 'function') {
      done(err, channel);
    }
  });

  return this;
};

/**
 * delegates the call to queue
 *
 * @return Queue / Server
 */

Server.prototype.queue = function (queue) {
  if (typeof queue !== 'undefined') {
    debug('attaching new queue, removing listener');
    this.exchange().queue().removeListener('message', this.onReceivedQueue);
    queue.addListener('message', this.onReceivedQueue);
    this.exchange().queue(queue);
    return this;
  }
  return this.exchange().queue();
};

/**
 * delegates the call to pubsub
 *
 * @return PubSub / Server
 */

Server.prototype.pubsub = function (pubsub) {
  if (typeof pubsub !== 'undefined') {
    debug('attaching new pubsub');
    this.exchange().pubsub(pubsub);
    return this;
  }
  return this.exchange().pubsub();
};

/**
 * delegates the call to messages()
 *
 * @return Boolean / Server
 */

Server.prototype.autoPropagate = function (v) {
  debug('calling messages autoPropagate %s', v);
  if (typeof v === 'boolean') {
    this.messages().autoPropagate(v);
    return this;
  }
  return this.messages().autoPropagate();
};

/**
 * Calls the passed method passing in our instance
 *
 * @param {Function} fn
 * @return Server
 */

Server.prototype.use = function (fn) {
  debug('calling passed method with us as an argument (middleware)');
  fn(this);
  return this;
};
