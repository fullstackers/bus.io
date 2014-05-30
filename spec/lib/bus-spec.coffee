EventEmitter = require('events').EventEmitter

describe 'bus', ->

  date = new Date

  Given ->
    @Message = class Message
      constructor: () ->
        if not (@ instanceof Message)
          return new Message
        @data =
          actor: 'me'
          action: 'say'
          content: 'hello'
          target: 'you'
          created: date
          id: 2
          reference: 1
          published: undefined

  Given ->
    @Sio = class Sio extends EventEmitter
      constructor: ->
        if not (@ instanceof Sio)
          return new Sio
      listen: ->

  Given ->
    @Builder = class Builder extends EventEmitter
      constructor: ->
        if not (@ instanceof Builder)
          return new Builder
      data: ->
        actor: 'me'
        action: 'say'
        content: 'hello'
        target: 'you'
        created: date

  Given ->
    @Handler = class Handler extends EventEmitter
      constructor: ->
        if not (@ instanceof Handler)
          return new Handler
      handle: (message) ->
      fn: ->

  Given ->
    @SocketMessages = class SocketMessages extends EventEmitter
      constructor: ->
      attach: ->
      dettach: ->
    @SocketMessages.make = ->
      return new SocketMessages

  Given ->
    @MessageExchange = class MessageExchange extends EventEmitter
      constructor: ->
      publish: ->
    @MessageExchange.make = ->
      return new MessageExchange

  Given ->
    @Bus = requireSubject 'lib/bus', {
      'socket.io': @Sio
      './message': @Message
      './message-builder': @Builder
      './message-handler': @Handler
      'socket-messages': @SocketMessages
      'message-exchange': @MessageExchange
    }

  Given -> @bus = @Bus()

  describe '#', ->
    
    Then -> expect(@bus instanceof @Bus).toBe true

  describe '#listen', ->

    context 'with port', ->

      Given -> @port = 3000
      Given -> spyOn(@bus.io(),['listen'])
      When -> @bus.listen @port
      Then -> expect(@bus.io().listen).toHaveBeenCalled()

    context 'socket.io instance', ->

      Given -> @io = @Sio()
      Given -> spyOn(@io,['listen'])
      When -> @bus.listen @io
      Then -> expect(@bus.io()).toEqual @io

  describe '#message', ->

    Given ->
      @params =
        actor: 'me'
        action: 'say'
        content: 'hello'
        target: 'you'
        created: date
    When -> @message = @bus.message @params
    Then -> expect(@message.data()).toEqual @params
    And -> expect(@message.listeners('built').length).toBe 1
    And -> expect(@message.listeners('built')[0]).toEqual @bus.onPublish

  describe '#messageExchange', ->

    Given -> @messageExchange = new @MessageExchange
    When -> @res = @bus.messageExchange(@messageExchange).messageExchange()
    Then -> expect(@res).toEqual @messageExchange

  describe '#socketMessages', ->

    Given -> @socketMessages = new @SocketMessages
    When -> @res = @bus.socketMessages(@socketMessages).socketMessages()
    Then -> expect(@res).toEqual @socketMessages

  describe '#io', ->

    Given -> spyOn(@bus.socketMessages(),['attach']).andCallThrough()
    Given -> @io = @Sio()
    When -> @res = @bus.io(@io).io()
    Then -> expect(@res).toEqual @io
    And -> expect(@bus.socketMessages().attach).toHaveBeenCalledWith @io

  describe '#on', ->
    Given -> @fn = ->
    Given -> spyOn(@bus.messageExchange(),['on']).andCallThrough()
    When -> @bus.on 'name', @fn
    Then -> expect(@bus.messageExchange().on).toHaveBeenCalled()
    And -> expect(@bus.messageExchange().on.mostRecentCall.args[0]).toBe 'name'
    And -> expect(typeof @bus.messageExchange().on.mostRecentCall.args[1]).toBe 'function'

  describe '#onPublish', ->

    context 'published', ->

      Given ->
        @message = @Message()
        @message.data.published = date
      Given -> spyOn(@bus.messageExchange(),['publish']).andCallThrough()
      When -> @bus.onPublish @message
      Then -> expect(@bus.messageExchange().publish).toHaveBeenCalledWith @message.data, @message.data.target

   context 'unpublished', ->
      
      Given -> @message = @Message()
      Given -> spyOn(@bus.messageExchange(),['publish']).andCallThrough()
      When -> @bus.onPublish @message
      Then -> expect(@bus.messageExchange().publish).toHaveBeenCalledWith @message.data


