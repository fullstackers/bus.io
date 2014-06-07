EventEmitter = require('events').EventEmitter

describe 'Router', ->

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
    @Point = class Point
      constructor: (index, fn, action) ->
        if not (@ instanceof Point)
          return new Point index, fn, action
        @fn = fn
        @action = action
        @index = index

  Given ->
    @Route = class Route extends EventEmitter
      constructor: ->
        if not (@ instanceof Route)
          return new Route
      process: (message) ->
        @emit 'deliver', message
      list: -> []
    
  Given -> @Router = requireSubject 'lib/router', {
    './route': @Route,
    './point': @Point,
    './message': @Message
  }

  describe '#()', ->

    Then -> expect(@Router() instanceof @Router).toBe true
    And -> expect(@Router() instanceof EventEmitter).toBe true

  describe 'prototype', ->

    Given -> @instance = @Router()

    describe '#routes()', ->

      Then -> expect(@instance.routes()).toEqual {}

    describe '#routes(action:String)', ->

      Given -> @action = 'say'
      Then -> expect(@instance.routes(@action)).toEqual null

    describe '#paths()', ->

      Then -> expect(@instance.paths()).toEqual {}

    describe '#paths(action:String="say")', ->

      Given -> @action = 'say'
      Then -> expect(@instance.paths(@action)).toEqual []
  
    describe '#on', ->
      
      Given -> @fn = jasmine.createSpy 'fn'
      Given -> @action = 'say'
      Given -> spyOn(@instance,['emit']).andCallThrough()

      context '(path:Sring="say", fn:Function)', ->

        When -> @instance.on @action, @fn
        Then -> expect(@instance.paths(@action).length).toBe 1
        And -> expect(@instance.paths(@action)[0] instanceof @Point).toBe true
        And -> expect(@instance.paths(@action)[0].fn).toEqual @fn
        And -> expect(@instance.paths(@action)[0].action).toEqual @action
        And -> expect(@instance.paths(@action)[0].index).toEqual 0
        And -> expect(@instance.emit).toHaveBeenCalledWith 'changed', @action

      context '(path:Sring="*")', ->

        When -> @instance.on @action, @fn
        Then -> expect(@instance.paths(@action).length).toBe 1
        And -> expect(@instance.paths(@action)[0] instanceof @Point).toBe true
        And -> expect(@instance.paths(@action)[0].fn).toEqual @fn
        And -> expect(@instance.paths(@action)[0].action).toEqual @action
        And -> expect(@instance.paths(@action)[0].index).toEqual 0
        And -> expect(@instance.emit).toHaveBeenCalledWith 'changed', @action

    describe '#getRoute(path:String="say")', ->

      Given -> @path = 'say'
      When -> @route = @instance.getRoute @path
      Then -> expect(@route instanceof @Route).toBe true
      And -> expect(@route.listeners('consume')[0]).toBe @instance.onConsume
      And -> expect(@route.listeners('deliver')[0]).toBe @instance.onDeliver
      And -> expect(@route.listeners('respond')[0]).toBe @instance.onRespond

    describe '#onChange(action:String)', ->

      Given -> @action = 'say'
      Given -> @instance.routes @action, @Route()
      When -> @instance.onChange @action
      Then -> expect(@instance.routes(@action)).toBe undefined

    describe '#onDeliver(message:Message)', ->

      Given -> @event = 'deliver'
      Given -> @message = @Message()
      Given -> spyOn(@instance,['emit']).andCallThrough()
      When -> @instance.onDeliver @message
      Then -> expect(@instance.emit).toHaveBeenCalledWith @event, @message

    describe '#onRespond(message:Message)', ->

      Given -> @event = 'respond'
      Given -> @message = @Message()
      Given -> spyOn(@instance,['emit']).andCallThrough()
      When -> @instance.onRespond @message
      Then -> expect(@instance.emit).toHaveBeenCalledWith @event, @message

    describe '#onConsume(message:Message)', ->

      Given -> @event = 'consume'
      Given -> @message = @Message()
      Given -> spyOn(@instance,['emit']).andCallThrough()
      When -> @instance.onConsume @message
      Then -> expect(@instance.emit).toHaveBeenCalledWith @event, @message

    describe '(message:Message)', ->

      Given -> @message = @Message()
    #  Given -> @route = @Route()
    #  Given -> spyOn(@route,['process']).andCallThrough()
    #  Given -> spyOn(@instance,['getRoute']).andReturn(@route)
      Given -> spyOn(@instance,['emit']).andCallThrough()
      When -> @instance.route @message
    #  Then -> expect(@instance.getRoute).toHaveBeenCalledWith @message.action()
    #  And -> expect(@route.process).toHaveBeenCalledWith @message
      And -> expect(@instance.emit).toHaveBeenCalledWith 'deliver', @message

    xdescribe '(message:null)', ->
      Then -> expect(=> @instance.route null).toThrow new Error('message must be a Message')

