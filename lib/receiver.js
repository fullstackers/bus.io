var util = require('util')
  , events = require('events')
  , common = require('bus.io-common')
  , Message = common.Message
  , Router = require('./router')
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
   * @param {Socekt} socket *optional
   * @param {function} done *optional
   */

  this.onReceive = function () {
    var args = Array.prototype.slice.call(arguments);

    var message = Message(args.shift());

    if (typeof args[args.length-1] === 'function') {
      var done = args.pop();
    }

    var params = [message].concat(args);
    self.router().route.call(self.router(), params, done);//([Message(message), socket], done);
  };

  /**
   * We use this method to let our listeners know we
   * have received a message
   *
   * @param {Message} message
   * @param {Socekt} socket * optional
   */

  this.onReceived = function (message) {
    events.EventEmitter.prototype.emit.apply(self,['received'].concat(Array.prototype.slice.call(arguments)))
  };

  /**
   * Used for propagating the errors
   *
   * @param {Error} err
   */

  this.onError = function (err) {
    events.EventEmitter.prototype.emit.apply(self,['error'].concat(Array.prototype.slice.call(arguments)))
  };

  /**
   * Used for propagating the consumed messages
   *
   * @param {Message} message
   * @param {Socket} socket *optional
   */

  this.onConsumed = function (message) {
    //self.emit('consumed', message, socket);
    events.EventEmitter.prototype.emit.apply(self,['consumed'].concat(Array.prototype.slice.call(arguments)))
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
    else if (type === 'function' && (o.length >= 1 && o.length <= 3)) {
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
