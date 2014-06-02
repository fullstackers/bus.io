EventEmitter = require('events').EventEmitter

describe 'message receiver', ->

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

      clone: ->
        return new Message
  
  Given -> @handlers = [
    (message, socket, next) ->
      console.log 'AAA'
      message.content += 'A'
      next()
    (message, socket, next) ->
      console.log 'BBB'
      message.content += 'B'
      next()
    (message, socket, next) ->
      console.log 'CCC'
      message.content += 'C'
      next()
  ]

  Given -> @MessageReceiver = requireSubject 'lib/message-receiver', {
    './message': @Message
  }

  Given -> @receiver = @MessageReceiver()

  describe '#fn', ->

    When -> @res = @receiver.fn()
    Then -> expect(@res.length).toBe 0

  describe '#use', ->

    When -> @receiver.use @handlers
    Then -> expect(@receiver.fn().length).toBe 3

  describe '#onReceive', ->

    Given -> @socket = new EventEmitter
    Given -> spyOn(@socket,['emit']).andCallThrough()
    Given -> @receiver.use @handlers
    Given -> spyOn(@receiver,['onComplete']).andCallThrough()
    Given -> @message = new @Message
    Given -> @content = @message.content + 'ABC'
    When (done)-> @receiver.onReceive @message, @socket, done
    Then -> expect(@receiver.onComplete).toHaveBeenCalledWith @message, @socket
    And -> expect(@socket.emit).toHaveBeenCalledWith @message.action, @message.actor, @content, @message.target, @message.created
  

