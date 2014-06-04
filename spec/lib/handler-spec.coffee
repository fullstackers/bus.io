EventEmitter = require('events').EventEmitter

describe 'Handler', ->

  date = new Date

  Given ->
    @Message = class Message
      constructor: ->
        if not(@ instanceof Message)
          return new Message
        @data =
          actor: 'me'
          action: 'say'
          content: 'hello'
          target: 'you'
          created: date
          reference: null
        @id = 1

      clone: ->
        return new Message

  Given ->
    @Builder = class Builder extends EventEmitter
      constructor: ->
        if not(@ instanceof Builder)
          return new Builder

  Given ->
    Message = @Message
    @Controller = class Controller extends EventEmitter
      constructor: ->
        if not(@ instanceof Controller)
          return new Controller
        @message = new Message
      respond: ->
        @.emit 'respond', @message
      deliver: ->
        @.emit 'deliver', @message
      consume: ->
        @.emit 'consume', @message

  Given -> @Handler = requireSubject 'lib/handler', {
    './message': @Message
    './builder': @Builder
    './controller': @Controller
  }

  describe '#onConsume', ->

    Given -> @handler = @Handler ->
    Given -> spyOn(@handler,['emit']).andCallThrough()
    When -> @handler.onConsume @Message()
    Then -> expect(@handler.emit).toHaveBeenCalledWith 'done'

  describe '#onRespond', ->

    Given -> @message = @Message()
    Given -> @handler = @Handler ->
    Given -> spyOn(@handler,['emit']).andCallThrough()
    When -> @handler.onRespond @message
    Then -> expect(@handler.emit).toHaveBeenCalledWith 'publish', @message

  describe '#onDeliver', ->

    Given -> @message = @Message()
    Given -> @handler = @Handler ->
    Given -> spyOn(@handler,['emit']).andCallThrough()
    When -> @handler.onDeliver @message
    Then -> expect(@handler.emit).toHaveBeenCalledWith 'publish', @message

  describe '#onBuilt', ->

    Given -> @message = @Message()
    Given -> @handler = @Handler ->
    Given -> spyOn(@handler,['emit']).andCallThrough()
    When -> @handler.onBuilt @message
    Then -> expect(@handler.emit).toHaveBeenCalledWith 'publish', @message

  describe '#handle', ->

    Given -> @message = @Message()
    Given -> @fn = jasmine.createSpy 'fn'
    Given -> @handler = @Handler @fn
    When -> @handler.handle @message
    Then -> expect(@fn).toHaveBeenCalled()
    And -> expect(@fn.mostRecentCall.args[0] instanceof @Controller).toEqual true
    And -> expect(@fn.mostRecentCall.args[0].message).toEqual @message

  describe '#message', ->
    Given -> @handler = @Handler ->
    When -> @message = @handler.message()
    Then -> expect(@message instanceof @Builder).toBe true

  context 'handling a message that calls consume', ->

    Given -> @message = @Message()
    Given ->
      @fn = (message) ->
        message.consume()
    Given -> @handler = @Handler @fn
    Given -> spyOn(@handler,['emit']).andCallThrough()
    Given -> spyOn(@handler,['onConsume']).andCallThrough()
    When -> @handler.handle @message
    Then -> expect(@handler.onConsume).toHaveBeenCalledWith @message
    And -> expect(@handler.emit).toHaveBeenCalledWith 'done'

  context 'handling a message that calls deliver', ->

    Given -> @message = @Message()
    Given ->
      @fn = (message) ->
        message.deliver()
    Given -> @handler = @Handler @fn
    Given -> spyOn(@handler,['emit']).andCallThrough()
    Given -> spyOn(@handler,['onDeliver']).andCallThrough()
    When -> @handler.handle @message
    Then -> expect(@handler.onDeliver).toHaveBeenCalledWith @message
    And -> expect(@handler.emit).toHaveBeenCalledWith 'publish', @message

  context 'handling a message that calls respond', ->

    Given -> @message = @Message()
    Given ->
      @fn = (message) ->
        message.respond 'bye'
    Given -> @handler = @Handler @fn
    Given -> spyOn(@handler,['emit']).andCallThrough()
    Given -> spyOn(@handler,['onRespond']).andCallThrough()
    When -> @handler.handle @message
    Then -> expect(@handler.onRespond).toHaveBeenCalledWith @message
    And -> expect(@handler.emit).toHaveBeenCalledWith 'publish', @message

