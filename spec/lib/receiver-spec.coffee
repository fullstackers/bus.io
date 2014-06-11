EventEmitter = require('events').EventEmitter

describe 'Receiver', ->

  Given ->
    @Router = class Router extends EventEmitter
      constructor: ->
        if not (@ instanceof Router)
          return new Router
      route: ->

  Given ->
    @Message = class Message
      constructor: ->
        if not (@ instanceof Message)
          return new Message
        @data =
          actor: 'me'
          action: 'say'
          content: 'hello'
          target: 'you'
          created: new Date
          reference: null
          id: 1

      clone: ->
        return new Message
  
  Given -> @handlers = [
    (message, socket, next) ->
      console.log 'AAA'
      message.data.content += 'A'
      next()
    (message, socket, next) ->
      console.log 'BBB'
      message.data.content += 'B'
      next()
    (message, socket, next) ->
      console.log 'CCC'
      message.data.content += 'C'
      next()
  ]

  Given -> @MessageReceiver = requireSubject 'lib/receiver', {
    './router': @Router
    './bus.io-common':
      Message: @Message
  }

  Given -> @instance = @MessageReceiver()

  describe '#use (fns:Array)', ->

    Given -> spyOn(@instance.router(),['on']).andCallThrough()
    When -> @instance.use @handlers
    Then -> expect(@instance.router().on).toHaveBeenCalled()
    And -> expect(@instance.router().on.argsForCall[0]).toEqual ['*', @handlers[0]]
    And -> expect(@instance.router().on.argsForCall[1]).toEqual ['*', @handlers[1]]
    And -> expect(@instance.router().on.argsForCall[2]).toEqual ['*', @handlers[2]]

  describe '#onReceive (message:Message)', ->

    Given -> @socket = new EventEmitter
    Given -> spyOn(@socket,['emit']).andCallThrough()
    Given -> @instance.use @handlers
    Given -> @message = new @Message
    Given -> @content = @message.data.content + 'ABC'
    When (done)-> @instance.onReceive @message, @socket, done
    And -> expect(@socket.emit).toHaveBeenCalledWith @message.data.action, @message.data.actor, @content, @message.data.target, @message.data.created
  
  describe '#router', ->

    When -> @res = @instance.router()
    Then -> expect(@res instanceof @Router).toBe true
    And -> expect(@res.listeners('next')[0]).toBe @instance.onReceived
    And -> expect(@res.listeners('deliver')[0]).toBe @instance.onReceived
    And -> expect(@res.listeners('respond')[0]).toBe @instance.onReceived
    And -> expect(@res.listeners('error')[0]).toBe @instance.onError
    And -> expect(@res.listeners('consume')[0]).toBe @instance.onConsumed

  describe '#onReceived', ->

    Given -> @message = @Message()
    Given -> @socket = new EventEmitter
    Given -> spyOn(EventEmitter.prototype.emit,['apply']).andCallThrough()
    When -> @instance.onReceived @message, @socket
    Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @instance, ['received', @message, @socket]

  describe '#onConsumed', ->

    Given -> @message = @Message()
    Given -> @socket = new EventEmitter
    Given -> spyOn(EventEmitter.prototype.emit,['apply']).andCallThrough()
    When -> @instance.onConsumed @message, @socket
    Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @instance, ['consumed', @message, @socket]


  describe '#onError', ->

    Given -> @error = 'test'
    Given -> @message = @Message()
    Given -> @socket = new EventEmitter
    Given -> spyOn(EventEmitter.prototype.emit,['apply'])
    When -> @instance.onError @error, @message, @socket
    Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @instance, ['error', @error, @message, @socket]

  
