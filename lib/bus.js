var util = require('util')
  , events = require('events')
  , sio = require('socket.io')
  , SocketMessages = require('socket-messages')
  , MessageExchange = require('message-exchange')
  , Message = require('./message')
  , Handler = require('./message-handler')
  , Builder = require('./message-builder')
  ;

module.exports = Bus;

/**
 * The bus
 */

function Bus () {

  if (!(this instanceof Bus)) return new Bus();

  var self = this;

  events.EventEmitter.call(this);

  this.onPublish = function (message) {

    console.log('onPublish', message);

    if (message.data.published) {
      self.messageExchange().publish(message.data, message.data.target);
    }
    else {
      message.data.published = new Date();
      self.messageExchange().publish(message.data);
    }
  };

  this.onConnection = function (socket) {

    console.log('onConnection', socket.id);

    function handle (message) {
      socket.emit.apply(socket, [message.action, message.actor].concat(message.content));
    }

    self.socketMessages().actor(socket, function (err, actor) {
      if (err) return self.emit('error', err);
      self.messageExchange().channel(actor).on('message', handle); 
      socket.on('disconnect', function () {
        self.messageExchange().channel(actor).removeListener('message', handle);
      });
    });

  };

  this.onMessage = function (message) {
    console.log('onMessage', message);
    self.message(message).deliver();
  };

  this.on('error', function (err) {
    console.error(err);
  });

}

util.inherits(Bus, events.EventEmitter);

/**
 * Listen on the port or socket.io instance
 *
 * @param {mixed} Either a number or a Socket.IO instance
 * @return Bus
 */

Bus.prototype.listen = function (a) {

  if (a instanceof sio) {
    this.io(a);
  }
  else if (!isNaN(a)) {
    this.io().listen(a);
  }

  return this;
};

/**
 * Gets a builder for the passed data
 *
 * @param {object} data
 * @return Builder
 */

Bus.prototype.message = function (data) {
  var builder = Builder(data);
  builder.on('built', this.onPublish);
  return builder;
};

/**
 * Sets / Gets the MessageExchange
 *
 * @param {MessageExchange} messageExchange
 * @return MessageExchange / Bus
 */

Bus.prototype.messageExchange = function (messageExchange) {

  if (typeof messageExchange !== 'undefined' && messageExchange instanceof MessageExchange) {
    
    if (this._messageExchange) {
      //TODO do we need to do anything? 
    }

    this._messageExchange = messageExchange;
    return this;
  }
  else {

    if (!this._messageExchange) {
      this._messageExchange = MessageExchange.make();
    }

  }

  return this._messageExchange;

}

/**
 * Sets / Gets SocketMessages instance
 *
 * @param {SocketMessages} io * optioanl
 * @return SocketMessages / Bus
 */

Bus.prototype.socketMessages = function (socketMessages) {
  
  if (typeof socketMessages !== 'undefined' && socketMessages instanceof SocketMessages) {

    if (this._socketMessages) {
      this._socketMessages.dettach(this.io());
      this._socketMessages.exchange().removeListener('message', this.onMessage);
    }

    this._socketMessages = socketMessages;
    this._socketMessages.attach(this.io());
    this._socketMessages.exchange().on('message', this.onMessage);
    return this;

  }

  if (!this._socketMessages) {
    this._socketMessages = SocketMessages.make();
    this._socketMessages.attach(this.io());
    this._socketMessages.exchange().on('message', this.onMessage);
  }

  return this._socketMessages;

};

/**
 * Sets / Gets Socket.IO instance
 *
 * @param {SocketIO} io * optioanl
 * @return SocketIO / Bus
 */

Bus.prototype.io = function (io) {

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

Bus.prototype.on = function (name, fn) {
  var handler = Handler(fn);
  handler.on('publish', this.onPublish); 
  this.socketMessages().action(name);
  this.messageExchange().handler.on(name, function (data) {
    handler.handle(Message(data));
  }); 
  return this;
};

