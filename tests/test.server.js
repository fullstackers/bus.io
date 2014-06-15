var expect  = require('chai').expect;
var server  = require('../lib/server');
var socket  = require('socket.io');
var common = require('bus.io-common');
var Messages = require('bus.io-messages')

describe('Testing Server.js', function () {
	// body...
	var bus = new server();
	it('It should be instance fof server', function() {
		expect(bus).to.be.an.instanceof(server);
	});

	it('should not throw an exception', function() {
		expect(server).to.not.throw(Error);

	});
	it('should define _messages which is instanceof Messages', function() {
		bus.onConnection(new socket());
		var messages = bus._messages;
		expect(messages).to.be.an.instanceof(Messages);
	});

	it('should set the actor ', function() {
		
		bus.onConnection(new socket());
		expect(bus.message().message.data.actor).to.equal('unknown');
		expect(bus.message().i('some_socket_id').message.data.actor).to.equal('some_socket_id');
	});

});	