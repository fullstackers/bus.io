var util = require('util')
  , events = require('events')
  , sio = require('socket.io')
  , MessageBuilder = require('./message-builder')
  ;

module.exports = Bus;

function Bus () {

  if (!(this instanceof Bus)) return new Bus();

  var self = this;

  events.EventEmitter.call(this);
  
  this.io = sio();

  this.onBuiltMessage = function (message) {

  };
}

util.inherits(Bus, events.EventEmitter);

Bus.prototype.listen = function (a) {

  if (a instanceof sio) {
    this.io = a;
  }
  else if (!isNaN(a)) {
    this.io.listen(a);
  }

  return this;
};

Bus.prototype.message = function (data) {
  var builder = MessageBuilder(data);
  builder.on('built', this.onBuiltMessage);
  return builder;
};
