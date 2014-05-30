var util = require('util')
  , events = require('events')
  , Message = require('./message')
  ;

module.exports = Builder;

function Builder (data) {

  if (!(this instanceof Builder)) return new Builder(data);

  events.EventEmitter.call(this);

  this.message = Message(data);

}

util.inherits(Builder, events.EventEmitter);

Builder.prototype.i = Builder.prototype.actor = setOrGet('actor');

Builder.prototype.did = Builder.prototype.action = setOrGet('action');

Builder.prototype.what = Builder.prototype.content = setOrGet('content');

Builder.prototype.target = setOrGet('target');

Builder.prototype.data = function (data) {

  if (typeof data === 'object') {
    this.message.data = data;
  }
  else {
    return this.message.data;
  }

  return this;

};

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

};

function setOrGet (k) {
  return function (v) {
    if (v) {
      this.message.data[k] = v;
      return this;
    }

    return this.message.data[k];
  }
}
