EventEmitter = require('events').EventEmitter

describe 'Route', ->

  Given ->
    @Point = class Point
      constructor: (index, fn, action) ->
        if not (@ instanceof Point)
          return new Point index, fn, action
        @fn = fn
        @action = action
        @index = index

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
      actor: -> @data.actor
      target: -> @data.target
      content: -> @data.content
      action: -> @data.action
      clone: ->
        return new Message

  Given ->
    Message = @Message
    @Controller = class Controller extends EventEmitter
      constructor: (message) ->
        if (not (@ instanceof Controller))
          return new Controller message
        @message = message
      deliver: ->
        @message.delivered = true
        @emit 'deliver', @message
      respond: ->
        @message.responded = true
        @emit 'respond', @message
      consume: ->
        @message.consumed = true
        @emit 'consume', @message

  Given -> @Route = requireSubject 'lib/route', {
    './controller':@Controller,
    './message': @Message,
    './point': @Point
  }

  describe '#()', ->

    Then -> expect(@Route() instanceof @Route).toBe true
    And -> expect(@Route() instanceof EventEmitter).toBe true

  describe 'prototype', ->

    Given -> @instance = @Route()

    describe '#process (message:Message)', ->

      context 'deliver', ->

        Given -> @message = @Message()
        Given -> spyOn(@instance, ['emit']).andCallThrough()
        When (done) -> @instance.process @message, done
        Then -> expect(@instance.emit).toHaveBeenCalledWith 'deliver', @message

      context 'respond', ->

        Given -> @message = @Message()
        Given -> @fn = (message, next) -> message.respond()
        Given -> @point = @Point 0, @fn, @message.action()
        Given -> @instance.list().push @point
        Given -> spyOn(@instance, ['emit']).andCallThrough()
        When (done) -> @instance.process @message, done
        Then -> expect(@instance.emit).toHaveBeenCalledWith 'respond', @message

      context 'consume', ->

        Given -> @message = @Message()
        Given -> spyOn(@instance, ['emit']).andCallThrough()
        Given -> @fn = (message, next) -> message.consume(); next()
        Given -> @point = @Point 0, @fn, @message.action()
        Given -> @instance.list().push @point
        When (done) -> @instance.process @message, done
        Then -> expect(@instance.emit).toHaveBeenCalledWith 'consume', @message

    describe '#process (message:null)', ->

      Given -> @message = null
      Then -> expect(=> @instance.process @message).toThrow new Error 'message must be a Message'

    describe '#list ()', ->

      Then -> expect(@instance.list()).toEqual []
