Builder = ->
Bus = requireSubject 'lib/bus', {
  './message-builder': Builder
}
Sio = require 'socket.io'

describe 'bus.io', ->

  Given -> @bus = Bus()

  describe '#', ->
    
    Then -> expect(@res instanceof Bus).toBe true

  describe '#listen', ->

    context 'with port', ->

      Given -> @port = 3000
      Given -> spyOn(@bus.io,['listen'])
      When -> @bus.listen @port
      Then -> expect(@bus.io.listen).toHaveBeenCalled()

    context 'socket.io instance', ->

      Given -> @io = Sio()
      Given -> spyOn(@io,['listen'])
      When -> @bus.listen @io
      Then -> expect(@bus.io).toEqual @io

  describe '#message', ->

    context 'no args', ->

      When -> @message = @bus.message()
      Then -> expect(@message instanceof Builder).toBe true

    context 'args', ->

      Given ->
        @params =
          actor: 'me'
          action: 'say'
          content: 'hello'
          target: 'you'
          creatd: new Date
      When -> @message = @bus.message @params
      Then -> expect(@message instanceof Builder).toBe true
      And -> expect(@message.data()).toBe @params
      And -> expect(@message.listeners('built').length).toBe 1
      And -> expect(@message.listeners('built')[0]).toEqual @bus.onBuiltMessage
