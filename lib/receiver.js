var util = require('util')
  , events = require('events')
  , async = require('async')
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

  this.onReceive = function (message, socket, done) {
    async.waterfall([function (cb) { cb(null, Message(message), socket); }].concat(self.fn()), function (err, message, socket) {
      if (err) {
        self.emit('error', err);
        if (typeof done === 'function') done(err);
      }
      else {
        self.emit('received', message, socket);
        if (typeof done === 'function') done(null, message, socket);
      }
    });
  };

}

util.inherits(Receiver, events.EventEmitter);

/**
 * The middleware functions
 *
 * @return Array
 */

Receiver.prototype.fn = function () {
  if (!this._fn) {
    this._fn = [];
  }
  return this._fn;
};

/**
 * Pass the functions as middleware
 * @param {function|Array} 
 * @return Receiver
 */

Receiver.prototype.use = function () {
  var self = this;
  Array.prototype.slice.call(arguments).forEach(function (o) {
    var type = typeof o;
    if (type === 'object' && o instanceof Array) {
      self.use.apply(self, o);
    }
    else if (type === 'function' && o.length === 3) {
      self.fn().push(function (message, socket, next) {
        o(message, socket, function (err) {
          if (err) return next(err);
          next(null, message, socket);
        })
      });
    }
  });
  return this;
};
