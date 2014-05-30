var util = require('util')
  , events = require('events')
  ;

module.exports = Controller;

function Controller (message) {

  if (!(this instanceof Controller)) return new Controller(message);

  events.EventEmitter.call(this);

  this.message = message;

}

util.inherits(Controller, events.EventEmitter);

Controller.prototype.consume = function () {
  this.message.consumed = new Date();
  this.emit('consume', this.message);
};

Controller.prototype.respond = function (content) {
  var message = this.message.clone();
  message.data.actor = this.message.data.target;
  message.data.target = this.message.data.actor;
  message.data.content = content;
  message.data.created = new Date();
  message.data.reference = this.message.id;

  this.emit('respond', message);
};

Controller.prototype.deliver = function () {
  this.emit('deliver', this.message);
};
