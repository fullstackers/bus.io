var util = require('util')
  , events = require('events')
  , Message = require('./message')
  ;

module.exports = Builder;

/**
 * Builds a Message instance and provides a way to deliver the built message
 *
 * @param {object} data
 */

function Builder (data) {

  if (!(this instanceof Builder)) return new Builder(data);

  events.EventEmitter.call(this);

  this.message = Message(data);

}

util.inherits(Builder, events.EventEmitter);

/**
 * Sets or gets the actor
 *
 * @param {mixed} actor
 * @return Object / Builder
 */

Builder.prototype.i = Builder.prototype.actor = setOrGet('actor');

/**
 * Sets or gets the action
 *
 * @param {mixed} action
 * @return Object / Builder
 */

Builder.prototype.did = Builder.prototype.action = setOrGet('action');

/**
 * Sets or gets the content
 *
 * @param {mixed} content
 * @return Object / Builder
 */

Builder.prototype.what = Builder.prototype.content = setOrGet('content');

/**
 * Sets or gets the target
 *
 * @param {mixed} target
 * @return Object / Builder
 */

Builder.prototype.target = setOrGet('target');

/**
 * Sets or gets the data
 *
 * @return Object / Builder
 */

Builder.prototype.data = function (data) {

  if (typeof data === 'object') {
    this.message.data = data;
  }
  else {
    return this.message.data;
  }

  return this;

};

/**
 * Delivers the message to each passed target
 *
 * @return Builder
 */

Builder.prototype.to = Builder.prototype.deliver = function () {

  if (arguments.length > 0) {
    this.target(String(arguments[0]));
  }

  if (this.target()) {
    this.emit('built', this.message);
  }

  if (arguments.length > 1) {
    var targets = Array.prototype.slice.call(arguments);
    for (var i=1; i<targets.length; i++) {
      var message = this.message.clone();
      message.target = String(targets[i]);
      this.emit('built', message);
    }
  }

  return this;

};

/**
 * Builds a setter and getter method
 *
 * @param {string} k
 * @return Function
 */

function setOrGet (k) {
  return function (v) {
    if (v) {
      this.message.data[k] = v;
      return this;
    }

    return this.message.data[k];
  }
}
