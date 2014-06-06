var util = require('util')
  , http = require('http')
  , events = require('events')
  , sio = require('socket.io')
  , SocketMessages = require('socket-messages')
  , MessageExchange = require('message-exchange')
  , Message = require('./message')
  , Handler = require('./handler')
  , Builder = require('./builder')
  , Receiver = require('./receiver')
  ;

module.exports = Server;

Server.Exchange = MessageExchange;


/**
 * The bus
 *
 * @param {object} io socket.io intance or http.Server
 */

function Server (a) {

  if (!(this instanceof Server)) return new Server(a);

  var self = this;

  events.EventEmitter.call(this);

  /**
   * Called when we are supposed to publish the message. this is bound to a 
   * Builder instance as well as a Handler instance
   *
   * @param {Message} message
   */

  this.onPublish = function (message) {

    if (message.data.published) {
      self.exchange().publish(message.data, message.data.target);
    }
    else {
      message.data.published = new Date();
      self.exchange().publish(message.data);
    }
  };


  /**
   * Called when we receive a socket connection, this is bound to the
   * socket.io instance
   *
   * @param {Socket} socket
   */

  this.onConnection = function (socket) {

    function handle (message) {
      self.emit('from exchange', message, socket);
    }

    self.socketMessages().actor(socket, function (err, actor) {
      if (err) return self.emit('error', err);
      self.exchange().channel(actor).on('message', handle); 
      socket.on('disconnect', function () {
        self.exchange().channel(actor).removeListener('message', handle);
      });
    });

  };

  /**
   * Called when we reeived a message from the SocketMessages.  This is bound
   * to the SocketMessages instance.  It will then emit an event for the
   * SocketReceiver intance to handle. This is when the SocketMessages instance
   * finishes createing the message and before the message is passed along to
   * the Receiver for processing before dispatched to the Exchange.
   *
   * @param {object} message
   * @param {Socket} socket
   * @see SocketMessages
   * @see Receiver
   */

  this.onMessage = function (message, socket) {
    self.emit('from socket', message, socket);
  };

  /**
   * Called after we have received a message from the Exchange
   *
   * @param {Message} message
   * @param {Socket} socket
   * @see MessageExchange
   * @see Receiver
   */

  this.onReceivedExchange = function (message, socket) {
    socket.emit.apply(socket, [message.data.action, message.data.actor].concat(message.data.content).concat([message.data.target, message.data.created]));
  };

  /**
   * Called after we have received a message from the socket.  This is after
   * the SocketMessage instance creates a message and the Receiver instance
   * processes it through the middleware.
   *
   * @param {Message} message
   * @param {Socket} socket
   * @see SocketMessages
   * @see Receiver
   */

  this.onReceivedSocket = function (message, socket) {
    self.message(message).deliver();
  };

  /**
   * Handles our error
   *
   * @param {mixed} err
   */

  this.onError = function (err) {
    console.error(err);
  };

  this.addListener('error', this.onError);

  this.socketReceiver();
  this.exchangeReceiver();

  if (a) {
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
    this.io(a);
  }
  else if (!isNaN(a)) {
    this.io().listen(a);
  }
  else {
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
  var builder = Builder(data);
  builder.on('built', this.onPublish);
  return builder;
};


/**
 * Sets / Gets the MessageExchange
 *
 * @param {MessageExchange} exchange
 * @return MessageExchange / Server
 */

Server.prototype.exchange = function (exchange) {

  if (typeof exchange !== 'undefined' && exchange instanceof MessageExchange) {
    
    if (this._exchange) {
      //TODO do we need to do anything? 
    }

    this._exchange = exchange;
    return this;
  }
  else {

    if (!this._exchange) {
      this._exchange = MessageExchange.make();
    }

  }

  return this._exchange;

};

/**
 * Sets / Gets the MessageExchange
 *
 * @deprecated Use exchange() instead
 * @param {MessageExchange} exchange
 * @return MessageExchange / Server
 */
Server.prototype.messageExchange = Server.prototype.exchange;

/**
 * Sets / Gets SocketMessages instance
 *
 * @param {SocketMessages} io * optioanl
 * @return SocketMessages / Server
 */

Server.prototype.socketMessages = function (socketMessages) {
  
  if (typeof socketMessages !== 'undefined' && socketMessages instanceof SocketMessages) {

    if (this._socketMessages) {
      this._socketMessages.dettach(this.io());
      this._socketMessages.exchange().removeListener('message', this.onMessage);
    }

    this._socketMessages = socketMessages;
    //this._socketMessages.attach(this.io());
    this._socketMessages.exchange().on('message', this.onMessage);
    return this;

  }

  if (!this._socketMessages) {
    this._socketMessages = SocketMessages.make();
    //this._socketMessages.attach(this.io());
    this._socketMessages.exchange().on('message', this.onMessage);
  }

  return this._socketMessages;

};

/**
 * Sets / Gets Socket.IO instance
 *
 * @param {SocketIO} io * optioanl
 * @return SocketIO / Server
 */

Server.prototype.io = function (io) {

  if (io) {
    
    if (this._io) {
      this.socketMessages().dettach(this._io);
      this._io.removeListener('connection', this.onConnection);
    }

    this._io = io;
    this.socketMessages().attach(this._io);
    this._io.on('connection', this.onConnection);
    return this;

  }

  if (!this._io) {
    this._io = sio();
    this.socketMessages().attach(this._io);
    this._io.on('connection', this.onConnection);
  }
  
  return this._io;

};

/**
 * Sets up a handler for the exchange
 *
 * @param {string} name
 * @param {function} fn
 * @see EventEmitter
 */

Server.prototype.on = function (name, fn) {
  var handler = Handler(fn);
  handler.on('publish', this.onPublish); 
  this.socketMessages().action(name);
  this.exchange().handler().on(name, function (data) {
    handler.handle(Message(data));
  }); 
  return this;
};

/**
 * delegate
 *
 * @see SocketMessages
 */

Server.prototype.actor = function () {
  var o = this.socketMessages();
  o.actor.apply(o, Array.prototype.slice.call(arguments));
  return this;
};

/**
 * delegate
 *
 * @see SocketMessages
 */

Server.prototype.target = function () {
  var o = this.socketMessages();
  o.target.apply(o, Array.prototype.slice.call(arguments));
  return this;
};

/**
 * initialize the receiver.  it will handle messages comming from the exchange
 * before it gets to the socket
 *
 * @see Receiver
 * @param {Receiver} o
 * @return Server / Receiver
 */

Server.prototype.exchangeReceiver = function (o) {

  if (typeof o === 'object' && o instanceof Receiver) {
    if (this._exchangeReceiver) {
      this.removeListener('from exchange', this._exchangeReceiver.onReceive);
      this._exchangeReceiver.addListener('receive', this.onReceivedExchange);
      this._exchangeReceiver.removeListener('error', this.onError);
      this._exchangeReceiver.removeListener('received', this.onReceivedExchange);
    }

    this._exchangeReceiver = o;
    this._exchangeReceiver.addListener('error', this.onError);
    this._exchangeReceiver.addListener('received', this.onReceivedExchange);
    this.addListener('from exchange', this._exchangeReceiver.onReceive);

    return this;
  }

  if (!this._exchangeReceiver || (!(this._exchangeReceiver instanceof Receiver))) {
    this._exchangeReceiver = Receiver();
    this._exchangeReceiver.addListener('error', this.onError);
    this._exchangeReceiver.addListener('received', this.onReceivedExchange);
    this.addListener('from exchange', this._exchangeReceiver.onReceive);
  }

  return this._exchangeReceiver;

};

/**
 * initialize the receiver.  it will handle messages comming from the socket
 * before it gets to the exchange
 *
 * @see Receiver
 * @return Server / Receiver
 */

Server.prototype.socketReceiver = function (o) {

  if (typeof o === 'object' && o instanceof Receiver) {
    if (this._socketReceiver) {
      this.removeListener('from socket', this._socketReceiver.onReceive);
      this._socketReceiver.removeListener('error', this.onError);
      this._socketReceiver.removeListener('received', this.onReceivedSocket);
    }

    this._socketReceiver = o;
    this._socketReceiver.addListener('error', this.onError);
    this._socketReceiver.addListener('received', this.onReceivedSocket);
    this.addListener('from socket', this._socketReceiver.onReceive);

    return this;
  }

  if (!this._socketReceiver || (!(this._socketReceiver instanceof Receiver))) {
    this._socketReceiver = Receiver();
    this._socketReceiver.addListener('error', this.onError);
    this._socketReceiver.addListener('received', this.onReceivedSocket);
    this.addListener('from socket', this._socketReceiver.onReceive);
  }

  return this._socketReceiver;

};

/**
 * Binds a method to the exchange receiver for processing the incomming 
 * messages from the exchange before being dispatched to the socket.
 *
 * @see Receiver
 * @param {function} fn
 * @return Server
 */

Server.prototype.in = function (fn) {
  this.exchangeReceiver().use(fn);
  return this;
};

/**
 * Binds a method to the socket receiver for processing the incomming
 * message received from the SocketMessages before being dispatched to the 
 * exchange.
 *
 * @see Receiver
 * @param {function} fn
 * @return Server
 */

Server.prototype.out = function (fn) {
  this.socketReceiver().use(fn);
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
 * @return Server
 */

Server.prototype.alias = function (socket, name) {

  var self = this;
  var handle = function (message) {
    self.emit('from exchange', message, socket);
  };

  this.exchange().channel(name).on('message', handle);

  socket.on('disconnect', function () {
    self.exchange().channel(name).removeListener('message', handle);
  });

  return this;
};

/**
 * delegates the call to queue
 *
 * @return Queue / Exchange
 */

Server.prototype.queue = function (queue) {
  return this.exchange().queue.call(this.exchange(), queue);
};
