BusIO = require './../../.'
Sio = require 'socket.io'

describe 'bus.io', ->

  Given -> @bus = BusIO()

  describe '#', ->
    
    Then -> expect(@res instanceof BusIO).toBe true

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

  describe '#handle',

    Given -> spyOn(@bus.emit).andCallThrough()
    Given -> @message =
      actor: 'me'
      action: 'say'
      content: 'hello'
      target: 'you'
    When ->  @bus.handle @message
    Then -> expect(@bus.emit).toHaveBeenCalledWith 'say', jasmine.any(Object)

