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
      @actor: -> @data.actor
      @target: -> @data.target
      @content: -> @data.content
      @action: -> @data.action

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
    @Route = class Route
      constructor: ->
        if not (@ instanceof Route)
          return new Route
      process: ->
      list: -> []
    
  Given -> @Router = requireSubject 'lib/router', {
    './point': @Point,
    './route': @Route
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

      context.only '(path:Sring="say", fn:Function)', ->

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

    describe '#route(message:Message, cb:Function)', ->

      Given -> @message = @Message()
      Given -> @cb = jasmine.createSpy 'cb'
      Given -> @route = @Route()
      Given -> spyOn(@route,['process']).andCallThrough()
      Given -> spyOn(@instance.getRoute).andReturn(@route)
      When -> @instance.route @message, @cb
      Then -> expect(@route.process).toHaveBeenCalledWith @message
      And -> expect(@instance.buildRoute).toHaveBeenCalledWith @message.action()
      And -> expect(@cb).toHaveBeenCalled()

    describe.only '#onChange(action:String)', ->

      Given -> @action = 'say'
      Given -> @instance.routes @action, @Route()
      When -> @instance.onChange @action
      Then -> expect(@instance.routes(@action)).toBe undefined
