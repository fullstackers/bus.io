var util = require('util')
  , events = require('events')
  , Message = require('./message')
  , Builder = require('./message-builder')
  , Controller = require('./message-controller')
  ;

module.exports = Handler;

function Handler (fn) {

  if (typeof fn !== 'function')
    throw new Error('fn must be a function');

  if (!(this instanceof Handler)) return new Handler(fn);

  events.EventEmitter.call(this);

  this.fn = fn;

  var self = this;

  this.onConsume = function (message) {
    self.emit('done');
  };

  this.onRespond = function (message) {
    self.emit('publish', message);
  };

  this.onDeliver = function (message) {
    self.emit('publish', message);
  };

  this.onBuilt = function (message) {
    self.emit('publish', message);
  };

  this.handle = function (message) {
    if (!(message instanceof Message)) throw new Error('message must be a Message');

    if (message.consumed) return false;

    var builder = Builder();

    var controller = Controller(message);
    controller.on('consume', self.onConsume);
    controller.on('respond', self.onRespond);
    controller.on('deliver', self.onDeliver);

    fn.call(self, controller);

  };

}

util.inherits(Handler, events.EventEmitter);

Handler.prototype.message = function () {
  var builder = Builder();
  builder.on('built', this.onBuilt);
  return builder;
};

