BusIO = require './../../.'
Sio = require 'socket.io'

describe 'bus.io', ->

  describe '#', ->
    
    When -> @res = BusIO()
    Then -> expect(@res instanceof BusIO).toBe true

  describe '#listen', ->

    Given -> @bus = BusIO()

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

