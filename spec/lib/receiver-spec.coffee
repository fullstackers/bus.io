EventEmitter = require('events').EventEmitter
Common = require 'bus.io-common'
Message = Common.Message

describe 'Receiver', ->

  Given -> @Route = requireSubject 'lib/route', {
    'bus.io-common': Common
  }
  Given -> @Router = requireSubject 'lib/router', {
    'bus.io-common': Common
    './route': @Route
  }
  
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

  Given -> @Receiver = requireSubject 'lib/receiver', {
    './router': @Router
    'bus.io-common': Common
  }

  Then -> expect(typeof @Receiver).toBe 'function'

  describe '#', ->

    When -> @res = @Receiver()
    Then -> expect(@res instanceof @Receiver).toBe true
    Then -> expect(@res instanceof EventEmitter).toBe true

  describe 'prototype', ->

    Given -> @instance = @Receiver()

    describe '#use (fns:Array)', ->

      Given -> spyOn(@instance.router(),['on']).andCallThrough()
      When -> @instance.use @handlers
      Then -> expect(@instance.router().on).toHaveBeenCalled()
      And -> expect(@instance.router().on.argsForCall[0]).toEqual ['*', @handlers[0]]
      And -> expect(@instance.router().on.argsForCall[1]).toEqual ['*', @handlers[1]]
      And -> expect(@instance.router().on.argsForCall[2]).toEqual ['*', @handlers[2]]

    describe '#onReceive (message:Message, socket:Scoket)', ->

      Given -> @socket = new EventEmitter
      Given -> spyOn(@socket,['emit']).andCallThrough()
      Given -> @instance.use @handlers
      Given -> @message = Message()
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

    describe '#onReceived (message:Message, socket:Socket)', ->

      Given -> @message = Message()
      Given -> @socket = new EventEmitter
      Given -> spyOn(EventEmitter.prototype.emit,['apply']).andCallThrough()
      When -> @instance.onReceived @message, @socket
      Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @instance, ['received', @message, @socket]

    describe '#onReceived (message:Message)', ->

      Given -> @message = Message()
      Given -> spyOn(EventEmitter.prototype.emit,['apply']).andCallThrough()
      When -> @instance.onReceived @message
      Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @instance, ['received', @message]

    describe '#onConsumed (message:Message, socket:Socket)', ->

      Given -> @message = Message()
      Given -> @socket = new EventEmitter
      Given -> spyOn(EventEmitter.prototype.emit,['apply']).andCallThrough()
      When -> @instance.onConsumed @message, @socket
      Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @instance, ['consumed', @message, @socket]

    describe '#onConsumed (message:Message)', ->

      Given -> @message = Message()
      Given -> spyOn(EventEmitter.prototype.emit,['apply']).andCallThrough()
      When -> @instance.onConsumed @message
      Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @instance, ['consumed', @message]


    describe '#onError', ->

      Given -> @error = 'test'
      Given -> @message = Message()
      Given -> @socket = new EventEmitter
      Given -> spyOn(EventEmitter.prototype.emit,['apply'])
      When -> @instance.onError @error, @message, @socket
      Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @instance, ['error', @error, @message, @socket]

    
