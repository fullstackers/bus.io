describe 'a bus has a socket connected with a listener and the socket sends a message', ->

  describe 'it should be handled by the bus go back to the socket', ->

    Given ->
      @bus = require('./..')(3000)
      @bus.on 'echo', (message) -> message.deliver()

    Given -> @message = 'Hello, World'

    Given (done) ->
      @socket = require('socket.io-client').connect('ws://localhost:3000')
      @socket.on 'connect', => 
        @socket.emit 'echo', @message
      @socket.on 'echo', (who, what) =>
        @what = what
        done()

    Then -> expect(@what).toEqual @message

