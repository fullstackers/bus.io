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
  message.data.reference = this.message.data.id;

  this.message.responded = new Date();
  this.emit('respond', message);
  return this;
};

/**
 * Delivers the message
 * 
 * @return Controller
 */

Controller.prototype.deliver = function () {
  this.message.delivered = new Date();
  if (arguments.length === 0) {
    this.emit('deliver', this.message);
  }
  else if (arguments.length === 1) {
    if (typeof arguments[0] === 'object' && arguments[0] instanceof Array) {
      deliverEach(this, arguments[0]);
    }
    else {
      var message = this.message.clone();
      message.data.target = String(arguments[0]);
      this.emit('deliver', message);
    }
  }
  else if (arguments.length > 1) {
    deliverEach(this, Array.prototype.slice.call(arguments));
  }
  return this;
};

/**
 * set up delegates
 */

'actor action target content id created reference published'.split(' ').forEach(function (name) {
  Controller.prototype[name] = function () {
    return this.message[name].apply(this.message,Array.prototype.slice.call(arguments));
  }
});

function deliverEach (controller, targets) {
  targets.forEach(function (target) {
    var message = controller.message.clone();
    message.data.target = target;
    controller.emit('deliver', message);
  });
}
