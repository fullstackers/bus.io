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
        @actor -> @data.actor
        @target -> @data.target
        @content -> @data.content
        @action -> @data.action

      clone: ->
        return new Message

  Given ->
    @Point = class Point
      constructor: (fn, action, index)
        if not (@ instanceof Message)
          return new Point fn, action, index
        @fn = fn
        @action = action
        @index = index

  Given ->
    @Route = class Route
      constructor: ->
        if not (@ instanceof Message)
          return new Message
      process: ->
      list: -> []
    
  Given -> @Router = requireSubject 'lib/router', {
    './point': @Point,
    './route': @Route
  }

  describe '#()', ->

    Then -> expect(@Router() instanceof @Router).toBe true

  describe 'prototype', ->

    Given -> @instance = @Router()
  
    describe.on '#on', ->
      
      Given -> @fn = jasmine.createSpyObj 'fn'

      context 'path:Sring="say", fn:Function', ->

        Given -> @path = 'say'
        When -> @instance.on @path, @fn
        Then -> expect(@instance.paths(@path).length).toBe 1
        And -> expect(@instance.paths(@path)[0] instanceof @Point).toBe true
        And -> expect(@instance.paths(@path)[0].fn).toEqual @fn
        And -> expect(@instance.paths(@path)[0].action).toEqual @action
        And -> expect(@instance.paths(@path)[0].index).toEqual 0

      context 'path:Sring="*"', ->

        Given -> @path = 'say'
        When -> @instance.on @path, @fn
        Then -> expect(@instance.paths(@path).length).toBe 1
        And -> expect(@instance.paths(@path)[0] instanceof @Point).toBe true
        And -> expect(@instance.paths(@path)[0].fn).toEqual @fn
        And -> expect(@instance.paths(@path)[0].action).toEqual @action
        And -> expect(@instance.paths(@path)[0].index).toEqual 0

    describe '#buildRoute(path:String="say")', ->

      Given -> @path = 'say'
      When -> @route = @instance.buildRoute @path
      Then -> expect(@route instanceof @Route).toBe true

    describe '#route(message:Message, cb:Function)', ->

      Given -> @message = @Message()
      Givne -> @cb = jasmine.createSpyObj 'cb'
      Given -> @route = @Route()
      Given -> spyOn(@route,['process']).andCallThrough()
      Given -> spyOn(@instance.buildRoute).andReturn(@route)
      When -> @instance.route @message, @cb
      Then -> expect(@route.process).toHaveBeenCalledWith @message
      And -> expect(@instance.buildRoute).toHaveBeenCalledWith @message.action()
      And -> expect(@cb).toHaveBeenCalled()

