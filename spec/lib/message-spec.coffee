describe 'Message', ->

  Given -> @Message = requireSubject 'lib/message', {
    'node-uuid':
      v1: -> 2
  }

  Given -> @date = new Date
  Given -> @params =
    actor: 'me'
    action: 'say'
    content: 'what'
    target: 'you'
    created: @date
    reference: 1
    published: undefined
    id: 2

  describe '#', ->

    context 'no params', ->

      When -> @message = @Message()
      Then -> expect(@message instanceof @Message).toBe true

    context 'with object', ->
      When -> @message = @Message @params
      Then -> expect(@message.data).toEqual @params

    context 'params', ->
      When -> @message = @Message 'me', 'say', 'what', 'you', @date, 2, 1
      Then -> expect(@message.data).toEqual @params

  describe '#clone', ->

    Given -> @message = @Message @params
    When -> @res = @message.clone()
    Then -> expect(@res.data).toEqual @message.data


  describe '#actor', ->

    Given -> @message = @Message()
    Given -> @v = 'a'
    Then -> expect(@message.actor(@v).actor()).toEqual @v
  
  describe '#action', ->

    Given -> @message = @Message()
    Given -> @v = 'a'
    Then -> expect(@message.action(@v).action()).toEqual @v

  describe '#target', ->

    Given -> @message = @Message()
    Given -> @v = 'a'
    Then -> expect(@message.target(@v).target()).toEqual @v

  describe '#content', ->
   
    Given -> @message = @Message()

    context 'array', ->

      Given -> @v = ['a']
      Then -> expect(@message.content(@v).content()).toEqual @v

    context 'object', ->

      Given -> @v = a: 1
      Then -> expect(@message.content(@v).content()).toEqual @v

  describe '#id', ->

    Given -> @message = @Message()
    When -> expect(@message.id()).toEqual @message.data.id

  describe '#created', ->

    Given -> @message = @Message()
    When -> expect(@message.created()).toEqual @message.data.created

  describe '#reference', ->

    Given -> @message = @Message()
    When -> expect(@message.reference()).toEqual @message.data.reference

  describe '#published', ->

    Given -> @message = @Message()
    When -> expect(@message.published()).toEqual @message.data.published
