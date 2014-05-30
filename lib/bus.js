var util = require('util')
  , events = require('events')
  , sio = require('socket.io')
  , SocketMessages = require('socket-messages')
  , MessageExchange = require('message-exchange')
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

  this.onBuiltMessage = function (message) {
    // TODO take the message and publish onto an exchange
  };

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
  builder.on('built', this.onBuiltMessage);
  return builder;
};

/**
 * Sets / Gets the MessageExchange
 *
 * @param {MessageExchange} messageExchange
 */

/**
 * Sets / Gets SocketMessages instance
 *
 * @param {SocketMessages} io * optioanl
 * @return SocketMessages / Bus
 */

Bus.prototype.socketMessages = function (socketMessages) {
  
  if (socketMessages instanceof SocketMessages) {

    if (this._socketMessages) {
      this._socketMessages.dettach(this.io());
    }

    this._socketMessages = socketMessages;
    this._socketMessages.attach(this.io());
    return this;

  }

  if (!this._socketMessages) {
    this._socketMessages = SocketMessages.make();
    this._socketMessages.attach(this.io());
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
    }

    this._io = io;
    this.socketMessages().attach(this._io);
    return this;

  }

  if (!this._io) {
    this._io = sio();
    this.socketMessages().attach(this._io);
  }
  
  return this._io;

};
