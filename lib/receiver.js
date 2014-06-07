var util = require('util')
  , events = require('events')
  , async = require('async')
  , Router = require('./router')
  , Message = require('./message')
  ;

module.exports = Receiver;

/**
 * A Receiver pipes a message through a series of "middleware" functions that
 * have the ability to consume or manipulate a message before going to its
 * destination.
 */

function Receiver () {

  if (!(this instanceof Receiver)) return new Receiver();

  events.EventEmitter.call(this);

  var self = this;

  /**
   * We bind this method to an input source
   *
   * @param {Message} message
   * @param {Socekt} socket
   * @param {function} done
   */

  this.onReceive = function (message, socket, done) {
    self.router().route([Message(message), socket], done);
  };

  /**
   * We use this method to let our listeners know we
   * have received a message
   *
   * @param {Message} message
   * @param {Socekt} socket
   */

  this.onReceived = function (message, socket) {
    self.emit('received', message, socket);
  };

  /**
   * Used for propagating the errors
   *
   * @param {Error} err
   */

  this.onError = function (err) {
    self.emit('error', err);
  };

  /**
   * Used for propagating the consumed messages
   *
   * @param {Message} message
   * @param {Socket} socket
   */

  this.onConsumed = function (message, socket) {
    self.emit('consumed', message, socket);
  };

}

util.inherits(Receiver, events.EventEmitter);


/**
 * Pass the functions as middleware
 * @param {function|Array} 
 * @return Receiver
 */

Receiver.prototype.use = function () {
  var self = this;
  var args = Array.prototype.slice.call(arguments);
  var action = '*';
  if (args.length === 0) return this;
  if (args.length === 1 && typeof args[0] !== 'function' && typeof args[0] !== 'object') {
    throw new Error('Expecting a function');
  }
  if (args.length > 1 && typeof args[0] === 'string') {
    action = args.shift();
  }
  args.forEach(function (o) {
    var type = typeof o;
    if (type === 'object' && o instanceof Array) {
      self.use.apply(self, o);
    }
    else if (type === 'function' && (o.length == 2 || o.length === 3)) {
      self.router().on(action, o);
    }
  });
  return this;
};

/**
 * initialize the router
 *
 * @return {Router} router
 */

Receiver.prototype.router = function () {
  if (!this._router) {
    this._router = Router();
    this._router.addListener('next', this.onReceived);
    this._router.addListener('deliver', this.onReceived);
    this._router.addListener('respond', this.onReceived);
    this._router.addListener('consume', this.onConsumed);
    this._router.addListener('error', this.onError);
  }
  return this._router;
};
