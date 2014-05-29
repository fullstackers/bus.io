var sio = require('socket.io');

module.exports = Bus;

function Bus () {

  if (!(this instanceof Bus)) return new Bus();
  
  this.io = sio();

}

Bus.prototype.listen = function (a) {

  if (a instanceof sio) {
    this.io = a;
  }
  else if (!isNaN(a)) {
    this.io.listen(a);
  }

};
