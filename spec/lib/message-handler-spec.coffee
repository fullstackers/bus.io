EventEmitter = require('events').EventEmitter

describe 'message handler', ->

  Given -> @Handler = requireSubject 'lib/message-handler', {}

  Given -> @bus = {}

  Given ->
    @sender = new EventEmitter
    spyOn(@sender,['emit']).andCallThrough()

  Given ->
    @message = new EventEmitter
    @message.consume = ->
      @.emit 'consume'
      @
    @message.deliver = ->
      @.emit 'deliver'
      @
    @message.respond = ->
      @.emit 'respond'
      @

  describe '#onConsume', ->

    Given -> @handler = @Handler ->
    Given -> spyOn(@handler,['emit']).andCallThrough()
    When -> @handler.onConsume @message
    Then -> expect(@handler.emit).toHaveBeenCalledWith 'done'

  describe '#onRespond', ->

    Given -> @handler = @Handler ->
    Given -> spyOn(@handler,['emit']).andCallThrough()
    When -> @handler.onRespond @message
    Then -> expect(@handler.emit).toHaveBeenCalledWith 'done'
    And -> expect(@sender.emit).toHaveBeenCalledWith 'publish', @message

  describe '#onDeliver', ->

    Given -> @handler = @Handler ->
    Given -> spyOn(@handler,['emit']).andCallThrough()
    When -> @handler.onDeliver @message
    Then -> expect(@handler.emit).toHaveBeenCalledWith 'done'
    And -> expect(@sender.emit).toHaveBeenCalledWith 'publish', @message

  context 'handling a message that calls consume', ->

    Given ->
      @fn = (message, bus) ->
        message.consume()
    Given -> @handler = @Handler @fn
    Given -> spyOn(@handler,['emit']).andCallThrouhg()
    Given -> spyOn(@handler,['onConsume']).andCallThrough()
    When -> @handler.handle @message, @bus 
    Then -> expect(@handler.emit).toHaveBeenCalledWith 'done'
    And -> expect(@handler.onConsume).toHaveBeenCalledWith @message

  context 'handling a message that calls deliver', ->

    Given ->
      @fn = (message, bus) ->
        message.deliver()
    Given -> @handler = @Handler @fn
    Given -> spyOn(@handler,['emit']).andCallThrouhg()
    Given -> spyOn(@handler,['onDeliver']).andCallThrough()
    When -> @handler.handle @message, @bus
    Then -> expect(@handler.emit).toHaveBeenCalledWith 'done'
    And -> expect(@handler.onDeliver).toHaveBeenCalledWith @message

  context 'handling a message that calls respond', ->

    Given ->
      @fn = (message, bus) ->
        message.respond 'bye'
    Given -> @handler = @Handler @fn
    Given -> spyOn(@handler,['emit']).andCallThrouhg()
    Given -> spyOn(@handler,['onRespond']).andCallThrough()
    When -> @handler.handle @message, @bus
    Then -> expect(@handler.emit).toHaveBeenCalledWith 'done'
    And -> expect(@handler.onDeliver).toHaveBeenCalledWith @message

