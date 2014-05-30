Message = require './../../lib/message'

describe 'message', ->

  Given -> @params =
    actor: 'me'
    action: 'say'
    content: 'what'
    target: 'you'

  describe '#', ->

    context 'no params', ->

      When -> @message = Message()
      Then -> expect(@message instanceof Message).toBe true

    context 'with object', ->
      When -> @message = Message @params
      Then -> expect(@message.data).toEqual @params

    context 'params', ->

      When -> @message = Message 'me', 'say', 'what', 'you'
      Then -> expect(@message.data).toEqual actor:'me', action:'say', content:'what', target:'you'

  describe '#clone', ->
    Given -> @message = Message @params
    When -> @res = @message.clone()
    Then -> expect(@res).toEqual @message
