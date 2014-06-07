var util = require('util')
  , events = require('events')
  , async = require('async')
  , Route = require('./route')
  , Point = require('./point')
  , Message = require('./message')
  ;

module.exports = Router;

var wild = '*';

/**
 * Routes a message through a series of middleware functions
 *
 * @return Router
 */

function Router () {
  if (!(this instanceof Router)) return new Router();
  events.EventEmitter.call(this);
  this._paths = {};
  this._routes = {};
  this._index = 0;
  var self = this;

  /**
   * Handled when a route changes
   *
   * @param {string} action
   */

  this.onChange = function (action) {
    self._routes = self._routes || {};
    var route =self._routes[action];
    if (route) {
      route.removeListener('deliver', self.onDeliver);
      route.removeListener('consume', self.onConsume);
      route.removeListener('respond', self.onRespond);
      route.removeListener('next', self.onNext);
      delete self._routes[action]
    }
  };

  /**
   * Listen for a "deliver" event on a route, which will bubble it up
   */

  this.onDeliver = function () {
    events.EventEmitter.prototype.emit.apply(self, ['deliver'].concat(Array.prototype.slice.call(arguments)));
  };

  /**
   * Listen for a "consume" event on a route, which will bubble it up
   */

  this.onConsume = function () {
    events.EventEmitter.prototype.emit.apply(self, ['consume'].concat(Array.prototype.slice.call(arguments)));
  };

  /**
   * Listen for a "respond" event on a route, which will bubble it up
   */

  this.onRespond = function () {
    events.EventEmitter.prototype.emit.apply(self, ['respond'].concat(Array.prototype.slice.call(arguments)));
  };

  /**
   * Listen for a "next" event on a route, which will bubble it up
   */

  this.onNext = function () {
    events.EventEmitter.prototype.emit.apply(self, ['next'].concat(Array.prototype.slice.call(arguments)));
  };


  this.addListener('change', this.onChange);
}

util.inherits(Router, events.EventEmitter);

/**
 * Initialize the paths for the action*
 *
 * *optional
 *
 * @param {string} action
 * @return Object / Array
 */

Router.prototype.paths = function (action) {

  if (!this._paths) {
    this._paths = {};
  }

  if (typeof action === 'string') {
    if (!this._paths[action]) {
      this._paths[action] = [];
    }
    return this._paths[action];
  }

  return this._paths;
};

/**
 * Initialize the compiled routes for the action*
 *
 * *optional
 *
 * @param {string} action
 * @param {Route} route * optional
 * @return Object / Route / Exchange
 */

Router.prototype.routes = function (action, route) {

  if (!this._routes) {
    this._routes = {};
  }

  if (typeof action === 'string') {
    if (typeof route === 'object' && route instanceof Route) {
      this._routes[action] = route;
      return this;
    }
    return this._routes[action];
  }

  return this._routes;
};

/**
 * Attaches the function to the path with the action
 * 
 * @param {string} action
 * @param {function} fn
 */

Router.prototype.on = function (action, fn) {
  action = action || wild;
  this.paths(action).push(Point(this._index++, fn, action));   
  this.emit('changed', action);
  return this;
};

/**
 * intializes a route given the action
 *
 * @param {string} action
 * @return Route
 */

Router.prototype.getRoute = function (action) {
  action = action || wild;
  if (this.routes(action)) {
    return this.routes(action);
  }
  var route = this.routes(action, Route()).routes(action);
  route.on('consume', this.onConsume);
  route.on('deliver', this.onDeliver);
  route.on('respond', this.onRespond);
  route.on('next', this.onNext);
  var potential = []
    .concat(this.routes(wild), (action!==wild ? this.routes(action) : []))
    .sort(function (a, b) { return a.index - b.index  })
    ;
  potential.forEach(function (point) {
    if (point && (point.action === action || point.action === wild)) {
      route.list().push(point);
    }
  });
  return route;
};

/**
 * routes the message
 *
 * @param {Message} message / Array
 * @return Router
 * @throws Error
 */

Router.prototype.route = function (message, done) {/* done() is for testing */
  // TODO clean this up!
  if (typeof message === 'undefined') throw new Error('message is undefined');
  if (typeof message !== 'object') throw new Error('message is not an object');
  if (message instanceof Array && (!message.length || !(message[0] instanceof Message))) throw new Error('the first item must be a Message');
  if (!(message instanceof Array)) throw new Error('message must be a Message');

  if (message instanceof Array) {
    this.getRoute(message[0].action()).process(message, done);
  }
  else {
    this.getRoute(message.action()).process(message, done);
  }

  return this;
};
