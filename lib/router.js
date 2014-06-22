var util = require('util')
  , events = require('events')
  , debug = require('debug')('router')
  , common = require('bus.io-common')
  , Message = common.Message
  , Route = require('./route')
  , Point = require('./point')
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
  debug('new router');
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
    debug('a route has changed');
    self._routes = self._routes || {};
    var route =self._routes[action];
    if (route) {
      debug('we have the route and we are about to remove listeners');
      route.removeListener('deliver', self.onDeliver);
      route.removeListener('consume', self.onConsume);
      route.removeListener('respond', self.onRespond);
      route.removeListener('next', self.onNext);
      debug('the left over listeners', route._events);
      delete self._routes[action]
    }
  };

  /**
   * Listen for a "deliver" event on a route, which will bubble it up
   */

  this.onDeliver = function () {
    debug('on deliver', arguments);
    events.EventEmitter.prototype.emit.apply(self, ['deliver'].concat(Array.prototype.slice.call(arguments)));
  };

  /**
   * Listen for a "consume" event on a route, which will bubble it up
   */

  this.onConsume = function () {
    debug('on consume', arguments);
    events.EventEmitter.prototype.emit.apply(self, ['consume'].concat(Array.prototype.slice.call(arguments)));
  };

  /**
   * Listen for a "respond" event on a route, which will bubble it up
   */

  this.onRespond = function () {
    debug('on respond', arguments);
    events.EventEmitter.prototype.emit.apply(self, ['respond'].concat(Array.prototype.slice.call(arguments)));
  };

  /**
   * Listen for a "next" event on a route, which will bubble it up
   */

  this.onNext = function () {
    debug('on next', arguments);
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
      debug('initializing path for %s', action);
      this._paths[action] = [];
    }
    debug('getting path for %s', action);
    return this._paths[action];
  }

  debug('getting all paths');

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
      debug('adding the route for %s', action);
      this._routes[action] = route;
      return this;
    }
    debug('get the route for %r', action);
    return this._routes[action];
  }

  debug('getting all routes');

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
  debug('on action %s %s', action, typeof fn);
  var point = Point(this._index++, fn, action);
  this.paths(action).push(point);   
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
  debug('getting route %s', action);
  var route = this.routes(action);
  if (route) {
    debug('we have the route %s', action);
    return route;
  }
  debug('we are creating the route %s', action);
  route = this.routes(action, Route()).routes(action);
  route.on('consume', this.onConsume);
  route.on('deliver', this.onDeliver);
  route.on('respond', this.onRespond);
  route.on('next', this.onNext);

  var potential = []
    .concat(this.paths(wild), (action!==wild ? this.paths(action) : []))
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
  debug('routing the message', message, typeof done);
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
