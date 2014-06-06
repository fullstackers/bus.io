EventEmitter = require('events').EventEmitter

describe 'Route',

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
      @actor: -> @data.actor
      @target: -> @data.target
      @content: -> @data.content
      @action: -> @data.action

      clone: ->
        return new Message

  Given -> @Route = require 'lib/route', { }

  describe '#()', ->

    Then -> expect(@Route() instanceof @Router).toBe true
    And -> expect(@Route() instanceof EventEmitter).toBe true

  describe 'prototype', ->

    Given -> @instance = @Route()

    describe '#process (message:Message)', ->

      Given -> @message = @Message()
      Given -> spyOn(@instance, ['emit']).andCallThrough()
      When -> @route.process @message
      Then -> expect(@instance.emit).toHaveBeenCalledWith 'done', @message

    describe '#process (message:null)', ->

      Given -> @message = null
      When -> @test => @route.process @message
      Then -> expect(@test).toThrow new Error 'message must be a Message'

    describe '#list ()', ->

      Then -> expect(@instance.list()).toEqual []
