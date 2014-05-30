describe 'message', ->

  Given -> @Message = requireSubject 'lib/message', {}

  Given -> @date = new Date
  Given -> @params =
    actor: 'me'
    action: 'say'
    content: 'what'
    target: 'you'
    created: @date
    reference: null

  describe '#', ->

    context 'no params', ->

      When -> @message = @Message()
      Then -> expect(@message instanceof @Message).toBe true

    context 'with object', ->
      When -> @message = @Message @params
      Then -> expect(@message.data).toEqual @params

    context 'params', ->
      When -> @message = @Message 'me', 'say', 'what', 'you', @date, 'id', null
      Then -> expect(@message.data).toEqual @params

  describe '#clone', ->
    Given -> @message = @Message @params
    When -> @res = @message.clone()
    Then -> expect(@res.data).toEqual @message.data
