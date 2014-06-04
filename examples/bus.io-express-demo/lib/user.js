var store = require('redis').createClient();

module.exports = User;

function User (name, password) {
  this.name = name;
  this.password = password;
  this.following = [];
  this.followers = [];
  this.refCount = 0;
}

User.prototype.save = function (cb) {
  var self = this;
  store.set(this.name, JSON.stringify(this), function (err, ok) {
    if (err) return cb(err);
    if (ok === 'OK') return cb(null, self);
  });
};

User.get = function (name, cb) {
  store.get(name, function (err, user) {
    if (err) return cb(err);
    cb(null, user ? JSON.parse(user) : null);
  });
};
