var util = require('util')
  , events = require('events')
  , Message = require('./message')
  ;

module.exports = Controller;

/**
 * When handling a message we use a controller
 *
 * @param {Message} message
 * @throws Error
 */

function Controller (message) {

  if (!(message instanceof Message)) throw new Error('message must be an instanceof Message');

  if (!(this instanceof Controller)) return new Controller(message);

  events.EventEmitter.call(this);

  this.message = message;

  this.data = this.message.data;

}

util.inherits(Controller, events.EventEmitter);

/**
 * Flags the message as consumed
 *
 * @return Controller
 */

Controller.prototype.consume = function () {
  this.message.consumed = new Date();
  this.emit('consume', this.message);
  return this;
};

/**
 * Responds to the message with the given content
 *
 * @param {mixed} content
 * @return Controller
 */

Controller.prototype.respond = function (content) {
  var message = this.message.clone();
  message.data.actor = this.message.data.target;
  message.data.target = this.message.data.actor;
  message.data.content = content;
  message.data.created = new Date();
  message.data.reference = this.message.id;

  this.emit('respond', message);
  return this;
};

/**
 * Delivers the message
 * 
 * @return Controller
 */

Controller.prototype.deliver = function () {
  this.emit('deliver', this.message);
  return this;
};
