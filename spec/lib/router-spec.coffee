EventEmitter = require('events').EventEmitter
Common = require 'bus.io-common'
Message = Common.Message
Controller = Common.Message

describe 'Router', ->

  Given -> @Point = requireSubject 'lib/point', { }
  Given -> @Route = requireSubject 'lib/route', {
    'bus.io-common': Common
    './point': @Point
  }
  Given -> @Router = requireSubject 'lib/router', {
    'bus.io-common': Common
    './route': @Route
    './point': @Point
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

      context '(path:Sring="say", fn:Function)', ->

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

    describe '#getRoute (path:String="say")', ->

      Given -> @path = 'say'
      When -> @route = @instance.getRoute @path
      Then -> expect(@route instanceof @Route).toBe true
      And -> expect(@route.listeners('consume')[0]).toBe @instance.onConsume
      And -> expect(@route.listeners('deliver')[0]).toBe @instance.onDeliver
      And -> expect(@route.listeners('respond')[0]).toBe @instance.onRespond

    describe '#onChange (action:String)', ->

      Given -> @action = 'say'
      Given -> @instance.routes @action, @Route()
      When -> @instance.onChange @action
      Then -> expect(@instance.routes(@action)).toBe undefined

    describe '#onDeliver (message:Message)', ->

      Given -> @event = 'deliver'
      Given -> @message = Message()
      Given -> spyOn(EventEmitter.prototype.emit,['apply']).andCallThrough()
      When -> @instance.onDeliver @message
      Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @instance, [@event, @message]

    describe '#onRespond (message:Message)', ->

      Given -> @event = 'respond'
      Given -> @message = Message()
      Given -> spyOn(EventEmitter.prototype.emit,['apply']).andCallThrough()
      When -> @instance.onRespond @message
      Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @instance, [@event, @message]

    describe '#onConsume (message:Message)', ->

      Given -> @event = 'consume'
      Given -> @message = Message()
      Given -> spyOn(EventEmitter.prototype.emit,['apply']).andCallThrough()
      When -> @instance.onConsume @message
      Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @instance, [@event, @message]

    describe '#onNext (message:Message)', ->

      Given -> @event = 'next'
      Given -> @message = Message()
      Given -> spyOn(EventEmitter.prototype.emit,['apply']).andCallThrough()
      When -> @instance.onNext @message
      Then -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @instance, [@event, @message]


    describe '#deliver (message:Message)', ->

      Given -> @done = jasmine.createSpy 'done'
      Given -> @message = Message()
      Given -> @route = @Route()
      Given -> spyOn(@route,['process']).andCallThrough()
      Given -> spyOn(@instance,['getRoute']).andReturn(@route)
      Given -> spyOn(EventEmitter.prototype.emit,'apply').andCallThrough()
      Given -> spyOn(@instance,'emit').andCallThrough()
      When (done) -> @done = done; @instance.route @message, done
      Then -> expect(@instance.getRoute).toHaveBeenCalledWith @message.action()
      And -> expect(@route.process).toHaveBeenCalledWith @message, @done
      And -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @route, ['next', @message]

    describe '#deliver (message:null)', ->
      Then -> expect(=> @instance.route null).toThrow new Error('message must be a Message')

