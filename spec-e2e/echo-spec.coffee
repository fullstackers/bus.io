http = require 'http'

describe 'a bus has a socket.io-client that sends a message', ->

  describe 'it should be handled by the bus and go back to the socket', ->

    Given -> @bus = require('./..')(3000)

    Given -> @message = 'Hello, World'

    Given (done) ->
      @socket = require('socket.io-client').connect('ws://localhost:3000')
      @socket.on 'connect', =>
        @socket.emit 'echo', @message
      @socket.on 'echo', (who, what) =>
        @what = what
        done()

    Then -> expect(@what).toEqual @message

describe 'a bus has a bus.io-client that sends a message', ->

  describe 'it should be handled by the bus and go back to the socket', ->

    Given -> @bus = require('./..')(3002)

    Given -> @message = 'Hello, World'

    Given (done) ->
      @socket = require('bus.io-client').connect('ws://localhost:3002')
      @socket.on 'connect', =>
        @socket.emit 'echo', @message
      @socket.on 'echo', (msg) =>
        @what = msg.content()
        done()

    Then -> expect(@what).toEqual @message

describe 'a request for /bus.io/bus.io.js', ->

  describe 'it should resolved', ->

    Given -> @bus = require('./..')(3003)

    When (done) -> http.get 'http://localhost:3003/bus.io/bus.io.js', (res) =>
      data = ''
      res.setEncoding 'utf-8'
      res.on 'data', (chunk) ->
        data = data + chunk
      res.on 'end', =>
        @data = data
        done()
    Then -> expect(@data.length).toBeGreaterThan 0
     
