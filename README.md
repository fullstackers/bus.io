Bus seamlessly connects to clients together over a network.  Messages are 
produced by clients which are published to an exchange.  The exchange queues up
these messages to be handled.  When these messages are handled they can then
be published to subscribers over a channel.  Channels are identified by the
actors and targets.  Messages are composed of an actor, a target, an action, 
and the content.  A message describes an action performed by a client toward
another client or resource.  With bus.io we can build application that will
scale.  A practical approach would be to use socket.io-client to represent
each client.  Redis as the backbone for the queue and pubsub.

# Installation and Environment Setup

Install node.js (See download and install instructions here: http://nodejs.org/).

Install coffee-script

    > npm install coffee-script -g

Clone this repository

    > git clone git@github.com:NathanGRomano/bus.io.git

cd into the directory and install the dependencies

    > cd message-exchange
    > npm install && npm shrinkwrap --dev

# Examples

Soon

# Running Tests

Tests are run using grunt.  You must first globally install the grunt-cli with npm.

    > sudo npm install -g grunt-cli

## Unit Tests

To run the tests, just run grunt

    > grunt spec

# TODO

Working out the design
