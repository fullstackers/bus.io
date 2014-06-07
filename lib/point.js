module.exports = Point;

/**
 * Used in a route
 *
 * @param {number} index
 * @param {function} fn
 * @param {action} string
 * @throws Error
 */

function Point (index, fn, action) {
  if (!(this instanceof Point)) return new Point(index, fn, action);
	if (!fn) throw new Error('fn must be a function');
	if (!action) action = '*';
	this.fn = fn;
	this.action = action;
	this.index = index || 0;
}
