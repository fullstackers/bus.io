var extend = require('extend')
  , uuid = require('node-uuid')
  ;

module.exports = Message;

/**
 * A message represents an action performed by an actor on target with the content
 */

function Message () {

  if (!(this instanceof Message)) {
    if (arguments[0] instanceof Message) {
      return arguments[0];
    }
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
    this.data.actor = a || 'unknown';
    this.data.action = b || 'unknown';
    this.data.content = c || [];
    this.data.target = d || 'unknown';
    this.data.created = e || new Date();
    this.data.id = f || uuid.v1();
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

// set / get these functions

Message.prototype.actor = setOrGet('actor', 'unknown');
Message.prototype.action = setOrGet('action', 'unknown');
Message.prototype.target = setOrGet('target', 'unknown');
Message.prototype.content = setOrGet('content', function () { return []; }, function (a) { if (typeof a==='object' && a instanceof Array && a.length === 1) { return a[0]; } else { return a; }  });
Message.prototype.id = get('id', function () { return uuid.v1(); });
Message.prototype.created = get('created', function () { return new Date(); });
Message.prototype.reference = get('reference', null);
Message.prototype.published = get('published', false);

function get (name, def, onGet) {
  onGet = onGet || f;
  return function () {
    if (!this.data) {
      this.data = {};
    }
    this.data[name] = this.data[name] || (typeof def === 'function' ? def() : def);
    if (typeof this.data[name] === 'undefined') {
      this.data[name] = (typeof def === 'function' ? def() : def);
    }
    return onGet(this.data[name]);
  }
}

function set (name, onSet) {
  onSet = onSet || f;
  return function (v) {
    if (!this.data) {
      this.data = {};
    }
    this.data[name] = onSet(v);
    return this;
  }
}

function setOrGet (name, def, onGet, onSet) {
  var g = get(name, def, onGet), s = set(name, onSet);
  return function (v) {
    var self = this;
    if (v) {
      return s.call(this, v);
    }
    return g.call(this);
  }
}

function f (a) { return a; }
