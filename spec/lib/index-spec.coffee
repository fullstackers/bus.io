EventEmitter = require('events').EventEmitter
Sio = require 'socket.io'
Common = require 'bus.io-common'
Message = Common.Message
Builder = Common.Builder
Messages = require 'bus.io-messages'
Exchange = require('bus.io-exchange')

describe 'Server', ->

  date = new Date

  Given -> @Package = version: 1

  Given ->
    @Receiver = class Receiver extends EventEmitter
      constructor: ->
        if not (@ instanceof Receiver)
          return new Receiver
      use: ->
      onReceive: ->

  Given ->
    @Server = requireSubject 'lib/server', {
      'socket.io': Sio
      './receiver': @Receiver
      'bus.io-common': Common
      'bus.io-messages': Messages
      'bus.io-exchange': Exchange
      './../package.json': @Package
    }

  Then -> expect(typeof @Server).toBe 'function'
  And -> expect(@Server.version).toBe @Package.version
  And -> expect(@Server.Server).toBe @Server
  And -> expect(@Server.Exchange).toBe Exchange
  And -> expect(@Server.Messages).toBe Messages

  describe '#', ->
    
    Then -> expect(@Server() instanceof @Server).toBe true

    context '(a:mixed)', ->

      Given -> @mixed = 3000
      Given -> spyOn(@Server.prototype,['listen'])
      When -> @res = @Server @mixed
      Then -> expect(@res.listen).toHaveBeenCalledWith @mixed

  describe 'prototype', ->

    Given -> @bus = @Server()

    describe '#listen (a:Number)', ->

      Given -> @port = 3000
      Given -> spyOn(@bus.io(),['listen'])
      When -> @bus.listen @port
      Then -> expect(@bus.io().listen).toHaveBeenCalled()

    describe '#listen (a:SockeIO.Server)', ->

      Given -> @io = Sio()
      Given -> spyOn(@io,['listen'])
      When -> @bus.listen @io
      Then -> expect(@bus.io()).toEqual @io

    describe '#listen (a:http.Server)', ->

      Given -> @server = require('http').createServer (req, res) ->
      Given -> @spyOn(@server,['on'])
      When -> @bus.listen @server
      Then -> expect(@server.on).toHaveBeenCalled()

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

    describe '#exchange (exchange:Exchange)', ->

      Given -> @exchange = Exchange()
      When -> @res = @bus.exchange(@exchange).exchange()
      Then -> expect(@res).toEqual @exchange

    describe '#messages', ->

      Given -> @messages = Messages()
      Given -> spyOn(@messages,['on']).andCallThrough()
      When -> @res = @bus.messages(@messages).messages()
      Then -> expect(@res).toEqual @messages
      And -> expect(@messages.on).toHaveBeenCalledWith 'message', @bus.onMessage

    describe '#io', ->

      Given -> spyOn(@bus.messages(),['attach']).andCallThrough()
      Given -> @io = Sio()
      When -> @res = @bus.io(@io).io()
      Then -> expect(@res).toEqual @io
      And -> expect(@bus.messages().attach).toHaveBeenCalledWith @io

    describe '#on', ->

      context '(0:String="name", 1:Function)', ->

        Given -> spyOn(@bus,['processing']).andCallThrough()
        Given -> spyOn(@bus.processing(),['use']).andCallThrough()
        Given -> spyOn(@bus.messages(),['action']).andCallThrough()
        Given -> @fn = (a, b, c) ->
        When -> @bus.on 'name', @fn
        Then -> expect(@bus.processing).toHaveBeenCalled()
        And -> expect(@bus.messages().action).toHaveBeenCalledWith 'name'
        And -> expect(@bus.processing().use).toHaveBeenCalledWith 'name', @fn

      context '(0:Function)', ->

        Given -> spyOn(@bus,['processing']).andCallThrough()
        Given -> spyOn(@bus.processing(),['use']).andCallThrough()
        Given -> @fn = (a, b, c) ->
        When -> @bus.on @fn
        Then -> expect(@bus.processing).toHaveBeenCalled()
        And -> expect(@bus.processing().use).toHaveBeenCalledWith @fn

    describe '#onPublish', ->

      context 'published', ->

        Given ->
          @message = Message()
          @message.data.published = date
        Given -> spyOn(@bus.exchange(),['publish']).andCallThrough()
        When -> @bus.onPublish @message
        Then -> expect(@bus.exchange().publish).toHaveBeenCalledWith @message, @message.target()

     context 'unpublished', ->
        
        Given -> @message = Message()
        Given -> spyOn(@bus.exchange(),['publish']).andCallThrough()
        When -> @bus.onPublish @message
        Then -> expect(@bus.exchange().publish).toHaveBeenCalledWith @message

    describe '#onConnection', ->

      Given ->
        @socket = new EventEmitter
        @socket.id = 'me'
      Given -> spyOn(@bus.messages(),['actor']).andCallThrough()
      Given -> spyOn(@bus.exchange(),['subscribe']).andCallThrough()
      Given -> spyOn(@socket,['on']).andCallThrough()
      When -> @bus.onConnection @socket
      Then -> expect(@bus.messages().actor).toHaveBeenCalledWith @socket, jasmine.any(Function)
      And -> expect(@bus.exchange().subscribe).toHaveBeenCalledWith 'me', jasmine.any(Function), jasmine.any(Function)
      And -> expect(@socket.on).toHaveBeenCalledWith 'disconnect', jasmine.any(Function)

    describe '#onError (err:Error)', ->
      Given -> spyOn(console,['error'])
      When -> @bus.onError 'message'
      Then -> expect(console.error).toHaveBeenCalledWith 'message'

    describe '#onMessage (message:Message, socket:Socket)', ->

      Given -> @message = Message()
      Given -> @socket = new EventEmitter
      Given -> spyOn(@bus,['emit']).andCallThrough()
      When -> @bus.onMessage @message, @socket
      Then -> expect(@bus.emit).toHaveBeenCalledWith 'from socket', @message, @socket

    describe '#onReceivedPubSub (message:Message, socket:Socket)', ->

      Given -> @message = Message()
      Given -> @socket = new EventEmitter
      When -> @bus.onReceivedPubSub @message, @socket
      And -> expect(@socket.emit).toHaveBeenCalledWith @message.data.action, @message.data.actor, @message.data.content, @message.data.target, @message.data.created

    describe '#onReceivedQueue (message:Message, socket:Socket)', ->

      Given -> spyOn(@bus,['emit']).andCallThrough()
      Given -> @message = Message()
      When -> @bus.onReceivedQueue @message
      Then -> expect(@bus.emit).toHaveBeenCalledWith 'from exchange queue', @message

    describe '#onReceivedSocket (message:Message, socket:Socket)', ->

      Given -> @message = Message()
      Given -> @socket = new EventEmitter
      Given -> @builder = Builder()
      Given -> spyOn(@builder,['deliver']).andCallThrough()
      Given -> spyOn(@bus,['message']).andCallThrough().andReturn(@builder)
      When -> @bus.onReceivedSocket @message, @socket
      Then -> expect(@bus.message).toHaveBeenCalled()
      And -> expect(@builder.deliver).toHaveBeenCalled()

    describe '#actor', ->

      Given -> spyOn(@bus.messages(),['actor'])
      When -> @bus.actor()
      Then -> expect(@bus.messages().actor).toHaveBeenCalled()

    describe '#actor (fn:Function)', ->

      Given -> @fn = jasmine.createSpy 'fn'
      Given -> spyOn(@bus.messages(),['actor'])
      When -> @bus.actor @fn
      Then -> expect(@bus.messages().actor).toHaveBeenCalledWith @fn

    describe '#target', ->

      Given -> spyOn(@bus.messages(),['target'])
      When -> @bus.target()
      Then -> expect(@bus.messages().target).toHaveBeenCalled()

    describe '#target (fn:Function)', ->

      Given -> @fn = jasmine.createSpy 'fn'
      Given -> spyOn(@bus.messages(),['target'])
      When -> @bus.target @fn
      Then -> expect(@bus.messages().target).toHaveBeenCalledWith @fn

    describe '#incomming', ->

      Given -> spyOn(@bus,['addListener']).andCallThrough()
      Given -> @receiver = @Receiver()
      Given -> spyOn(@receiver,['addListener']).andCallThrough()
      When -> @res = @bus.incomming(@receiver).incomming()
      Then -> expect(@res).toEqual @receiver
      And -> expect(@receiver.addListener).toHaveBeenCalledWith 'error', @bus.onError
      And -> expect(@bus.addListener).toHaveBeenCalledWith 'from socket', @receiver.onReceive

    describe '#in', ->

      Given -> spyOn(@bus,['incomming']).andCallThrough()
      Given -> spyOn(@bus.incomming(),['use']).andCallThrough()
      Given -> @fn = (a, b, c) ->
      When -> @bus.in @fn
      Then -> expect(@bus.incomming).toHaveBeenCalled()
      And -> expect(@bus.incomming().use).toHaveBeenCalledWith @fn

    describe '#processing', ->

      Given -> spyOn(@bus,['addListener']).andCallThrough()
      Given -> @receiver = @Receiver()
      Given -> spyOn(@receiver,['addListener']).andCallThrough()
      When -> @res = @bus.processing(@receiver).processing()
      Then -> expect(@res).toEqual @receiver
      And -> expect(@receiver.addListener).toHaveBeenCalledWith 'error', @bus.onError
      And -> expect(@receiver.addListener).toHaveBeenCalledWith 'received', @bus.onPublish
      And -> expect(@bus.addListener).toHaveBeenCalledWith 'from exchange queue', @receiver.onReceive

    describe '#outgoing', ->

      Given -> spyOn(@bus,['addListener']).andCallThrough()
      Given -> @receiver = @Receiver()
      Given -> spyOn(@receiver,['addListener']).andCallThrough()
      When -> @res = @bus.outgoing(@receiver).outgoing()
      Then -> expect(@res).toEqual @receiver
      And -> expect(@receiver.addListener).toHaveBeenCalledWith 'error', @bus.onError
      And -> expect(@bus.addListener).toHaveBeenCalledWith 'from exchange pubsub', @receiver.onReceive

    describe '#out', ->

      Given -> spyOn(@bus,['outgoing']).andCallThrough()
      Given -> spyOn(@bus.outgoing(),['use']).andCallThrough()
      Given -> @fn = (a, b, c) ->
      When -> @bus.out @fn
      Then -> expect(@bus.outgoing).toHaveBeenCalled()
      And -> expect(@bus.outgoing().use).toHaveBeenCalledWith @fn


    describe '#socket', ->

      Given -> @socket = new EventEmitter
      Given -> @fn = jasmine.createSpy()
      Given -> @bus.socket @fn
      When -> @bus.io().emit 'connection', @socket
      Then -> expect(@fn).toHaveBeenCalledWith @socket, @bus

    describe '#alias', ->

      Given -> @name = 'me'
      Given -> @socket = new EventEmitter
      Given -> @socket.id = 'you'
      Given -> spyOn(@socket,['on']).andCallThrough()
      Given -> spyOn(@bus.exchange(),['subscribe']).andCallThrough()
      Given -> spyOn(@bus.exchange(),['addListener']).andCallThrough()
      Given (done) -> @bus.alias @socket, @name, done
      Then -> expect(@bus.exchange().subscribe).toHaveBeenCalledWith @name, jasmine.any(Function), jasmine.any(Function)
      And -> expect(@socket.on).toHaveBeenCalledWith 'disconnect', jasmine.any(Function)
      And -> expect(@bus.exchange().addListener).toHaveBeenCalledWith 'channel ' + @name, jasmine.any(Function)

      context 'triggering an event', ->
      
        Given -> @message = Message()
        Given -> @message.data.target = @name
        Given -> spyOn(@bus,['emit']).andCallThrough()
        When -> @bus.exchange().emit 'channel ' + @name, @message
        Then -> expect(@bus.emit).toHaveBeenCalledWith 'from exchange pubsub', @message, @socket

      context 'socket disconnect', ->

        When -> @socket.emit 'disconnect'
        Then -> expect(@bus.exchange().listeners('channel ' + @name).length).toBe 0

    describe '#queue', ->

      Given -> spyOn(@bus.exchange(),['queue']).andCallThrough()
      When -> @bus.queue()
      Then -> expect(@bus.exchange().queue).toHaveBeenCalled()

      context '(queue:Queue)', ->

        Given -> @q = Exchange.Queue()
        Given -> @e = @bus.exchange().queue()
        Given -> spyOn(@e,['removeListener']).andCallThrough()
        Given -> spyOn(@q,['addListener']).andCallThrough()
        When -> @bus.queue(@q)
        Then -> expect(@bus.exchange().queue).toHaveBeenCalledWith @q
        And -> expect(@e.removeListener).toHaveBeenCalledWith 'message', @bus.onReceivedQueue
        And -> expect(@q.addListener).toHaveBeenCalledWith 'message', @bus.onReceivedQueue

    describe '#pubsub', ->

      Given -> spyOn(@bus.exchange(),['pubsub']).andCallThrough()
      When -> @bus.pubsub()
      Then -> expect(@bus.exchange().pubsub).toHaveBeenCalled()

      context 'pubsub:PubSub', ->

        Given -> @q = Exchange.PubSub()
        When -> @bus.pubsub(@q)
        Then -> expect(@bus.exchange().pubsub).toHaveBeenCalledWith @q

    describe '#autoPropagate', ->

      Given -> spyOn(@bus.messages(),'autoPropagate').andCallThrough()
      When -> @res = @bus.autoPropagate()
      Then -> expect(@res).toBe true
      And -> expect(@bus.messages().autoPropagate).toHaveBeenCalled()

      context '(v:Boolean=true)', ->

        When -> @res = @bus.autoPropagate true
        Then -> expect(@res).toBe @bus
        And -> expect(@bus.messages().autoPropagate).toHaveBeenCalledWith true

      context '(v:Boolean=false)', ->

        When -> @res = @bus.autoPropagate false
        Then -> expect(@res).toBe @bus
        And -> expect(@bus.messages().autoPropagate).toHaveBeenCalledWith false

    describe '#use (fn:Function)', ->

      Given -> @fn = jasmine.createSpy 'fn'
      When -> @bus.use @fn
      Then -> expect(@fn).toHaveBeenCalledWith @bus
