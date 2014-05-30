var util = require('util')
  , events = require('events')
  , sio = require('socket.io')
  , MessageBuilder = require('./message-builder')
  ;

module.exports = Bus;

/**
 * The bus
 */

function Bus () {

  if (!(this instanceof Bus)) return new Bus();

  var self = this;

  events.EventEmitter.call(this);
  
  this.io = sio();

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
    this.io = a;
  }
  else if (!isNaN(a)) {
    this.io.listen(a);
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
  var builder = MessageBuilder(data);
  builder.on('built', this.onBuiltMessage);
  return builder;
};
