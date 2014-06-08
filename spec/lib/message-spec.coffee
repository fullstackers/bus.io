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

    Then -> expect(@Message() instanceof @Message).toBe true

  describe '# (a:Message)', ->

    Then -> expect(@Message(@params).data).toEqual @params

  describe '# (a:String,b:String,c:String,d:String,e:Date,f:Number,g:Number)', ->

    Then -> expect(@Message('me', 'say', 'what', 'you', @date, 2, 1).data).toEqual @params

  describe 'protototype', ->

    Given -> @message = @Message()

    describe '#clone', ->

      Given -> @message = @Message @params
      When -> @res = @message.clone()
      Then -> expect(@res.data).toEqual @message.data

    describe '#actor', ->

      Then -> expect(@message.actor()).toEqual 'unknown'

    describe '#actor (v:String)', ->

      Given -> @v = 'a'
      Then -> expect(@message.actor(@v).actor()).toEqual @v
    
    describe '#action', ->

      Then -> expect(@message.action()).toEqual 'unknown'

    describe '#action (v:String)', ->

      Given -> @v = 'a'
      Then -> expect(@message.action(@v).action()).toEqual @v

    describe '#target', ->

      Then -> expect(@message.target()).toEqual 'unknown'

    describe '#target (v:String)', ->

      Given -> @v = 'a'
      Then -> expect(@message.target(@v).target()).toEqual @v

    describe '#content', ->
     
      Then -> expect(@message.content()).toEqual []

      context '(v:Array=["a"])', ->

        Given -> @v = ['a']
        Then -> expect(@message.content(@v).content()).toEqual 'a'

      context '(v:Array=["a","b"])', ->

        Given -> @v = ['a','b']
        Then -> expect(@message.content(@v).content()).toEqual @v

      context '(v:Object)', ->

        Given -> @v = a: 1
        Then -> expect(@message.content(@v).content()).toEqual @v

    describe '#id', ->

      Then -> expect(@message.id()).toEqual @message.data.id

    describe '#created', ->

      Then -> expect(@message.created()).toEqual @message.data.created

    describe '#reference', ->

      Then -> expect(@message.reference()).toEqual @message.data.reference

    describe '#published', ->

      Then -> expect(@message.published()).toEqual @message.data.published
