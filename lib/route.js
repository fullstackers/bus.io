var util = require('util')
  , events = require('events')
  , async = require('async')
  , Controller = require('./controller')
  , Message = require('./message')
  , Point = require('./point')
  ;

module.exports = Route;

/**
 * Represents a compiled list of functions that will be executed sequentially
 *
 * @return Route
 */

function Route () {
  if (!(this instanceof Route)) return new Route();
  events.EventEmitter.call(this);
}

util.inherits(Route, events.EventEmitter);

/**
 * executes the list of functions, sequentially given the message
 *
 * @param {Message} message
 * @param {function} done
 */

Route.prototype.process = function (message, done) {/* done() is for testing */
  var self = this;
  if (!(message instanceof Message)) throw new Error('message must be a Message');
  var fns = [
    function (cb) {
      var controller = Controller(message);
      controller.on('deliver', function (message) {
        self.emit('deliver', message);
      });
      controller.on('respond', function (message) {
        self.emit('respond', message);
      });
      controller.on('consume', function (message) {
        self.emit('consume', message);
      });
      if (typeof done === 'function') {
        controller.on('deliver', function (message) {
          done();
        });
        controller.on('respond', function (message) {
          done();
        });
        controller.on('consume', function (message) {
          done();
        });
      }
      cb(null, controller);
    }
  ];
  this.list().forEach(function (point) {
    fns.push(function (controller, cb) {
      // TODO i think we should also check if we "were delivered"
      if (controller.message.consumed || controller.message.delivered || controller.message.responded) return cb(true);
      point.fn(controller, function (err) {
        if (err) return cb(err);
        cb(null, controller);
      });
    });
  })
  async.waterfall(fns, function (err, controller) {
    if (err && err !== true) {
      self.emit('error', err);
    }
    else {
      controller.deliver();
    }
  });
  return this;
};

/**
 * Initializes a list of methods that will invoked
 *
 * @return Array
 */

Route.prototype.list = function () {
  if (!this._list) {
    this._list = [];
  }
  return this._list;
};
