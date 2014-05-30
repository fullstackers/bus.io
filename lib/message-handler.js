var util = require('util')
  , events = require('events')
  ;

module.exports = Handler;

function Handler () {

  if (!(this instanceof Messgae)) return new Messge();

  events.EventEmitter.call(this);

}

util.inherits(Handler, events.EventEmitter);
