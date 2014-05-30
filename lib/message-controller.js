var util = require('util')
  , events = require('events')
  ;

module.exports = Controller;

function Controller () {

  if (!(this instanceof Messgae)) return new Messge();

  events.EventEmitter.call(this);

}

util.inherits(Controller, events.EventEmitter);
