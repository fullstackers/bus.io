var util = require('util')
  , events = require('events')
  , Message = require('./message')
  ;

module.exports = Builder;

function Builder (data) {

  if (!(this instanceof Builder)) return new Builder(data);

  events.EventEmitter.call(this);

  this.message = Message(data);

  this.data(data);

}

util.inherits(Builder, events.EventEmitter);

Builder.prototype.data = function (data) {

  if (typeof data === 'object') {
    this.message.data = data;
  }
  else {
    return this.message.data;
  }

  return this;

};

