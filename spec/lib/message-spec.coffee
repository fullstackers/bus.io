Message = require './../../lib/message'

describe 'message', ->

  describe '#', ->

    context 'no params', ->

      When -> @message = Message()
      Then -> expect(@message instanceof Message).toBe true

    context 'with object', ->
      Given -> @params =
        actor: 'me'
        action: 'say'
        content: 'what'
        target: 'you'
      When -> @message = Message @params
      Then -> expect(@message.data).toEqual @params

    context 'params', ->

      When -> @message = Message 'me', 'say', 'what', 'you'
      Then -> expect(@message.data).toEqual actor:'me', action:'say', content:'what', target:'you'

