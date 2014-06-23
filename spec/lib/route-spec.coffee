EventEmitter = require('events').EventEmitter
Common = require 'bus.io-common'
Message = Common.Message
Controller = Common.Message

describe 'Route', ->

  Given -> @Point = requireSubject 'lib/point', { }
  Given -> @Route = requireSubject 'lib/route', {
    'bus.io-common': Common
    './point': @Point
  }

  Then -> expect(typeof @Route).toBe 'function'

  describe '#()', ->

    Then -> expect(@Route() instanceof @Route).toBe true
    And -> expect(@Route() instanceof EventEmitter).toBe true

  describe 'prototype', ->

    Given -> @route = @Route()

    describe '#process (message:Message)', ->

      context 'deliver', ->

        Given -> @message = Message()
        Given -> @fn = (message, next) -> message.deliver()
        Given -> @point = @Point 0, @fn, @message.action()
        Given -> @route.list().push @point
        Given -> spyOn(EventEmitter.prototype.emit, ['apply']).andCallThrough()
        Given -> spyOn(@route, ['emit']).andCallThrough()
        When (done) -> @route.process @message, done
        Then -> expect(@route.emit).toHaveBeenCalledWith 'done', 'deliver', [@message]
        And -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @route, ['deliver', @message]

      context 'respond', ->

        Given -> @message = Message()
        Given -> @fn = (message, next) -> message.respond()
        Given -> @point = @Point 0, @fn, @message.action()
        Given -> @route.list().push @point
        Given -> spyOn(EventEmitter.prototype.emit, ['apply']).andCallThrough()
        Given -> spyOn(@route, ['emit']).andCallThrough()
        When (done) -> @route.process @message, done
        Then -> expect(@route.emit).toHaveBeenCalledWith 'done', 'respond', [jasmine.any(Message)]
        And -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @route, ['respond', jasmine.any(Message)]
        And -> expect(@message.responded instanceof Date).toBe true

      context 'consume', ->

        Given -> @message = Message()
        Given -> spyOn(@route, ['emit']).andCallThrough()
        Given -> @fn = (message, next) -> message.consume(); next()
        Given -> @point = @Point 0, @fn, @message.action()
        Given -> @route.list().push @point
        Given -> spyOn(EventEmitter.prototype.emit, ['apply']).andCallThrough()
        When (done) -> @route.process @message, done
        Then -> expect(@route.emit).toHaveBeenCalledWith 'done', 'consume', [@message]
        And -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @route, ['consume', @message]

    describe '#process (message:null)', ->

      Given -> @message = null
      Then -> expect(=> @route.process @message).toThrow new Error 'message must be a Message'

    describe '#process (message:Array=[Mesage, events.EventEmitter])', ->

      Given -> @message = Message()
      Given -> @socket = new EventEmitter
      Given -> spyOn(EventEmitter.prototype.emit, ['apply']).andCallThrough()
      When (done) -> @route.process [@message, @socket], done
      Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @route, ['next', @message, @socket]

    describe '#list ()', ->

      Then -> expect(@route.list()).toEqual []
