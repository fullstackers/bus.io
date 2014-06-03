var util = require('util')
  , events = require('events')
  , Message = require('./message')
  , Builder = require('./builder')
  , Controller = require('./controller')
  ;

module.exports = Handler;

/**
 * The handler will take the function passed in and use it to handle a Message
 *
 * @param {function} fn
 * @throws Error
 */

function Handler (fn) {

  if (typeof fn !== 'function')
    throw new Error('fn must be a function');

  if (!(this instanceof Handler)) return new Handler(fn);

  events.EventEmitter.call(this);

  this.fn = fn;

  var self = this;

  /**
   * Emits a publish event with the message
   *
   * @param {Message} message
   */

  this.onConsume = function (message) {
    self.emit('done');
  };

  /**
   * Emits a publish event with the message
   *
   * @param {Message} message
   */

  this.onRespond = function (message) {
    self.emit('publish', message);
  };

  /**
   * Emits a publish event with the message
   *
   * @param {Message} message
   */

  this.onDeliver = function (message) {
    self.emit('publish', message);
  };

  /**
   * Emits a publish event with the message
   *
   * @param {Message} message
   */

  this.onBuilt = function (message) {
    self.emit('publish', message);
  };

  /**
   * Handles the message by wrapping it up in a Controller and calling the "fn"
   * using a builder as the context.
   *
   * @param {Message} message
   */

  this.handle = function (message) {
    if (!(message instanceof Message)) throw new Error('message must be a Message');

    if (message.consumed) return false;

    var controller = Controller(message);
    controller.on('consume', self.onConsume);
    controller.on('respond', self.onRespond);
    controller.on('deliver', self.onDeliver);

    self.fn.call(self, controller);

  };

}

util.inherits(Handler, events.EventEmitter);

/**
 * Gets a message builder
 *
 * @param {object} data
 * @return Builder
 */

Handler.prototype.message = function (data) {
  var builder = Builder(data);
  builder.on('built', this.onBuilt);
  return builder;
};

