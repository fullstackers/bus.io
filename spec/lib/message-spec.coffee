describe.only 'message', ->

  Given -> @Message = requireSubject 'lib/message', {}

  Given -> @date = new Date
  Given -> @params =
    actor: 'me'
    action: 'say'
    content: 'what'
    target: 'you'
    created: @date

  describe '#', ->

    context 'no params', ->

      When -> @message = @Message()
      Then -> expect(@message instanceof @Message).toBe true

    context 'with object', ->
      When -> @message = @Message @params
      Then -> expect(@message.data).toEqual @params

    context 'params', ->
      When -> @message = @Message 'me', 'say', 'what', 'you', @date
      Then -> expect(@message.data).toEqual actor:'me', action:'say', content:'what', target:'you', created: @date

  describe '#clone', ->
    Given -> @message = @Message @params
    When -> @res = @message.clone()
    Then -> expect(@res).toEqual @message
