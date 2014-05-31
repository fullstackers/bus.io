var extend = require('extend')
  , uuid = require('node-uuid')
  ;

module.exports = Message;

/**
 * A message represents an action performed by an actor on target with the content
 */

function Message () {

  if (!(this instanceof Message)) {
    var m = new Message();
    Message.prototype.initialize.apply(m, Array.prototype.slice.call(arguments));
    return m;
  }
  else {
    Message.prototype.initialize.apply(this, Array.prototype.slice.call(arguments));
  }

}

/**
 * Initializes the message instance
 *
 * @param {string} a The actor
 * @param {string} b The action
 * @param {string} c The content
 * @param {string} d The target
 * @param {Date} e The created
 * @param {String} f id of the message
 * @param {string} g The referenced message id
 * @param {Date} h The date it was published
 */

Message.prototype.initialize = function (a, b, c, d, e, f, g, h) {
  if (arguments.length === 1 && typeof a === 'object') {
    if (a instanceof Message) {
      this.data = a.clone().data;
    }
    else {
      this.data = a;
    }
  }
  else {
    this.data = {};
    this.data.actor = a;
    this.data.action = b;
    this.data.content = c;
    this.data.target = d;
    this.data.created = e;
    this.data.id = f;
    this.data.reference = g;
    this.data.published = h;
  }

  if (!this.data) {
    this.data = {};
  }
  
  if (!this.data.created) {
    this.data.created = new Date();
  }

  if (!this.data.id) {
    this.data.id = uuid.v1();
  }

  return this;
};

/**
 * Clones the message's data into a new message, however the id is now different
 *
 * @return Message
 */

Message.prototype.clone = function () {
  var m = new Message(extend({}, this.data));
  m.data.id = uuid.v1();
  return m;
};
