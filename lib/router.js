var util = require('util')
  , events = require('events')
  , async = require('async')
  , Point = require('./point')
  , Route = require('./route')
  ;

module.exports = Router;

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
  this.onChange = function (action) {
    delete self._routes[action];
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
    if (typeof routes === 'object' && route instanceof Route) {
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
  action = action || '*';
  this.paths(action).push(Point(this._index++, fn, action));   
  this.emit('changed', action);
  return this;
};

/**
 * intializes a route
 */

Router.prototype.getRoute = function (path) {

};

Router.prototype.route = function (message, cb) {

};
